import 'server-only';
import dns from 'node:dns';
import { MongoClient, type Db } from 'mongodb';

const MONGO_DB = process.env.MONGODB_DB || 'prod_zenfix';

// Read the URI lazily so it is resolved at connection time (runtime), not at
// module evaluation during `next build`. The build process has no access to
// the Vercel runtime environment variables, and a module-scope throw would
// abort "collect page data" for every API route that imports this module.
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  return uri;
}

/**
 * SRV / TXT resolution fallback.
 *
 * `mongodb+srv://` URIs require the Node.js DNS client to resolve
 * `_mongodb._tcp.<host>` SRV records. Some Windows setups (VPN/security
 * agents, WSL-created adapters) hand Node a local resolver on 127.0.0.1 that
 * refuses SRV queries with `ECONNREFUSED`, while A-record lookups via
 * `getaddrinfo` still work. In that situation we fall back to DNS-over-HTTPS
 * (Cloudflare, then Google) to fetch the SRV seedlist + TXT options and build
 * a direct `mongodb://` URI pointing at the replica-set members.
 *
 * Resolution is attempted once per process and cached.
 */

const DOH_RESOLVERS = [
  (name: string, type: string) =>
    fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
    }).then((r) => r.json()),
  (name: string, type: string) =>
    fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
    }).then((r) => r.json()),
];

async function resolveDoh(name: string, type: 'SRV' | 'TXT'): Promise<string[]> {
  for (const resolver of DOH_RESOLVERS) {
    try {
      const data = await resolver(name, type);
      const answers = Array.isArray(data?.Answer) ? data.Answer : [];
      const values = answers
        .filter((a: any) => a.type === (type === 'SRV' ? 33 : 16))
        .map((a: any) => a.data as string);
      if (values.length > 0) return values;
    } catch {
      // try next resolver
    }
  }
  throw new Error(`DNS-over-HTTPS failed to resolve ${type} for ${name}`);
}

interface Seedlist {
  hosts: string[]; // "host:port"
  options: Record<string, string>; // replicaSet, authSource, ...
}

async function resolveSeedlistSrv(host: string): Promise<Seedlist> {
  const srvName = `_mongodb._tcp.${host}`;
  let records: dns.SrvRecord[] = [];
  try {
    records = await dns.promises.resolveSrv(srvName);
  } catch {
    const entries = await resolveDoh(srvName, 'SRV');
    records = entries.map((e) => {
      const [priority, weight, port, target] = e.split(/\s+/);
      return {
        name: target.replace(/\.$/, ''),
        priority: Number(priority || 0),
        weight: Number(weight || 0),
        port: Number(port || 27017),
        target: target.replace(/\.$/, ''),
      };
    });
  }

  if (records.length === 0) {
    throw new Error(`No SRV records found for ${srvName}`);
  }

  const hosts = records
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((r) => `${r.name}:${r.port}`);

  // TXT options (authSource, replicaSet) — non-fatal if unavailable.
  const options: Record<string, string> = {};
  try {
    let txt: string[][] = [];
    try {
      txt = await dns.promises.resolveTxt(host);
    } catch {
      const values = await resolveDoh(host, 'TXT');
      txt = values.map((v) => v.replace(/^"|"$/g, '').split('&'));
    }
    for (const parts of txt) {
      for (const part of parts) {
        const eq = part.indexOf('=');
        if (eq === -1) continue;
        options[part.slice(0, eq)] = part.slice(eq + 1);
      }
    }
  } catch {
    // best effort only
  }

  return { hosts, options };
}

/** Convert a `mongodb+srv://` URI into a direct `mongodb://` URI. */
async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) return uri;

  const stripped = uri.slice('mongodb+srv://'.length);
  const atIndex = stripped.lastIndexOf('@');
  const credentials = atIndex === -1 ? '' : stripped.slice(0, atIndex + 1);
  const rest = atIndex === -1 ? stripped : stripped.slice(atIndex + 1);

  const slashIndex = rest.indexOf('/');
  const questionIndex = rest.indexOf('?');
  const firstDelim = Math.min(
    slashIndex === -1 ? rest.length : slashIndex,
    questionIndex === -1 ? rest.length : questionIndex
  );

  const host = rest.slice(0, firstDelim);
  const pathAndQuery = rest.slice(firstDelim); // e.g. "/zenfix?..." or "?retryWrites=true"

  const seed = await resolveSeedlistSrv(host);
  const hosts = seed.hosts.join(',');

  // Merge TXT options into the query string, preserving the original params.
  const qsPath = pathAndQuery.startsWith('/')
    ? pathAndQuery.slice(0, pathAndQuery.indexOf('?') === -1 ? pathAndQuery.length : pathAndQuery.indexOf('?'))
    : '';
  const originalQuery =
    (pathAndQuery.includes('?') ? pathAndQuery.slice(pathAndQuery.indexOf('?') + 1) : '') +
    (pathAndQuery.includes('?') ? '&' : '');

  const params = new URLSearchParams(originalQuery);
  for (const [key, value] of Object.entries({ ...seed.options, tls: 'true' })) {
    if (value && !params.has(key)) params.set(key, value);
  }
  if (!params.has('retryWrites')) params.set('retryWrites', 'true');

  return `mongodb://${credentials}${hosts}${qsPath}?${params.toString()}`;
}

/**
 * MongoDB connection singleton.
 *
 * In development, Next.js hot-reloads modules and would otherwise create a new
 * connection pool on every compile. We cache the client and the promise on
 * `globalThis` and reuse them across reloads to avoid exhausting the Atlas
 * connection limit.
 */
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _resolvedUri?: string;
};

/**
 * Credential-free fingerprint of the configured MONGODB_URI, for server-side
 * diagnostics. It never contains the username, password, or the raw URI, so it
 * is safe to log.
 */
function describeMongoUri(uri: string): Record<string, unknown> {
  const scheme = uri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb';
  const raw = uri.slice(uri.indexOf('://') + 3);
  const at = raw.lastIndexOf('@');
  const credentialPart = at >= 0 ? raw.slice(0, at) : '';
  const rest = at >= 0 ? raw.slice(at + 1) : raw;
  const host = rest.split(/[/?]/)[0];
  const user = credentialPart ? credentialPart.split(':')[0] : '';
  const password = credentialPart.includes(':') ? credentialPart.slice(credentialPart.indexOf(':') + 1) : '';
  const uriDbMatch = /^\/([^?]+)/.exec(rest);
  return {
    scheme,
    host,
    username_present: user.length > 0,
    username_length: user.length,
    password_length: password.length,
    password_requires_url_encoding: /[ @/?:%#]/.test(password),
    auth_source_in_uri: /(^|[&?])authSource=/i.test(rest),
    database_in_uri: uriDbMatch ? uriDbMatch[1] : '(not in URI)',
    env_db: MONGO_DB,
  };
}

/** Redact any `mongodb://` URI a driver error might embed before logging. */
function redactUris(text: string): string {
  return text.replace(/mongodb(\+srv)?:\/\/[^\s'"]*/gi, '[MONGODB_URI redacted]');
}

/**
 * Build a credential-free error for connection failures so server logs (and
 * any caller) never leak MONGODB_URI or its credentials, while still pointing
 * at what to check on the server.
 */
function mongoFailure(error: unknown): Error {
  const name = (error as { codeName?: string; name?: string })?.codeName || (error as { name?: string })?.name || 'Error';
  const raw = error instanceof Error ? error.message : String(error);
  const sanitizedRaw = redactUris(raw).replace(/\s+/g, ' ').trim().slice(0, 300);
  const authHint =
    name === 'AuthenticationFailed' || /bad auth|authentication failed/i.test(raw)
      ? ' MongoDB reached the cluster but rejected the credentials. Verify MONGODB_URI on the server (username, password URL-encoding, authSource) and Atlas Network Access; the application reads process.env.MONGODB_URI correctly.'
      : '';
  const prefix = `MongoDB connection failed: ${name}.`;
  const detail = sanitizedRaw && !/bad auth|authentication failed/i.test(sanitizedRaw) ? ` ${sanitizedRaw}` : '';
  return new Error(`${prefix}${detail}${authHint}`);
}

async function connect(): Promise<MongoClient> {
  // Resolve SRV once per process (system DNS first, DoH fallback).
  const uri = await (async () => {
    if (globalForMongo._resolvedUri) return globalForMongo._resolvedUri;
    const resolved = await resolveMongoUri(getMongoUri());
    globalForMongo._resolvedUri = resolved;
    return resolved;
  })();

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    maxPoolSize: 10,
    minPoolSize: 0,
    appName: 'zenfix',
  });
  try {
    await client.connect();
  } catch (error) {
    await client.close().catch(() => undefined);
    console.error('[mongodb] connection failed. config fingerprint:', describeMongoUri(getMongoUri()));
    throw mongoFailure(error);
  }
  return client;
}

export function getMongoClient(): Promise<MongoClient> {
  // Cache the connection promise on `globalThis` in all environments. In
  // development this (a) avoids creating a new pool on every hot reload and
  // (b) reuses the pool across reloads. In production it keeps a single
  // connection per serverless instance, which is the documented pattern for
  // Next.js + MongoDB. The promise is created lazily on first use, never at
  // module evaluation time, so importing this module during `next build`
  // cannot trigger a database connection.
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(MONGO_DB);
}

export async function getNextNumericId(sequenceName: string): Promise<number> {
  const db = await getDb();
  const collection = db.collection('zenfix_sequences');
  
  const result = await collection.findOneAndUpdate(
    { _id: sequenceName as any },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  
  // MongoDB driver v7 returns the document directly, not wrapped in { value }
  const doc = result as any;
  if (!doc) {
    throw new Error('Failed to generate numeric ID');
  }
  
  // Handle both v7 (direct document) and older versions ({ value: document })
  // v7: { _id: 'users.user', value: 5 }
  // v6: { value: { _id: 'users.user', value: 5 } }
  let value: number;
  if (typeof doc.value === 'number') {
    // v7 format - direct document
    value = doc.value;
  } else if (doc.value && typeof doc.value.value === 'number') {
    // v6 format - wrapped in { value }
    value = doc.value.value;
  } else {
    throw new Error('Failed to generate numeric ID - unexpected format');
  }
  
  if (value === undefined || value === null) {
    throw new Error('Failed to generate numeric ID');
  }
  
  return value;
}

export async function isMongoConnected(): Promise<boolean> {
  try {
    const client = await getMongoClient();
    await client.db(MONGO_DB).command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
