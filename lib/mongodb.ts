import 'server-only';
import dns from 'node:dns';
import { MongoClient, type Db } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB || 'zenfix';

if (!MONGO_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
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
export async function resolveMongoUri(uri: string): Promise<string> {
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

async function connect(): Promise<MongoClient> {
  // Resolve SRV once per process (system DNS first, DoH fallback).
  const uri = await (async () => {
    if (globalForMongo._resolvedUri) return globalForMongo._resolvedUri;
    const resolved = await resolveMongoUri(MONGO_URI as string);
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
  await client.connect();
  return client;
}

export function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'production') {
    return connect();
  }
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(MONGO_DB);
}

/** The single collection used to persist every ZenFix entity. */
export function dataCollection<T extends { _id?: any } = any>() {
  return getDb().then((db) => db.collection<T>('data'));
}

/**
 * Internal monotonic id counters, kept separate from the entity data so the
 * unique `{ entity, id }` index on the data collection never collides.
 * Keyed by `_id` = entity name.
 */
export function counterCollection<T extends { _id?: any } = any>() {
  return getDb().then((db) => db.collection<T>('counters'));
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

export async function getNextNumericId(sequenceName: string): Promise<number> {
  const db = await getDb();
  const collection = db.collection('zenfix_sequences');
  
  const result = await collection.findOneAndUpdate(
    { _id: sequenceName as any },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  
  if (!result || !result.value) {
    throw new Error('Failed to generate numeric ID');
  }
  
  return result.value.value;
}