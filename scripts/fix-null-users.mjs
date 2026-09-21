import { MongoClient } from 'mongodb';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dns from 'node:dns';

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, '.env');

function loadEnvFile() {
  if (existsSync(ENV_PATH)) {
    const content = readFileSync(ENV_PATH, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFile();

// DNS-over-HTTPS fallback (from client.ts)
const DOH_RESOLVERS = [
  (name, type) =>
    fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
    }).then((r) => r.json()),
  (name, type) =>
    fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
    }).then((r) => r.json()),
];

async function resolveDoh(name, type) {
  for (const resolver of DOH_RESOLVERS) {
    try {
      const data = await resolver(name, type);
      const answers = Array.isArray(data?.Answer) ? data.Answer : [];
      const values = answers
        .filter((a) => a.type === (type === 'SRV' ? 33 : 16))
        .map((a) => a.data);
      if (values.length > 0) return values;
    } catch {
      // try next resolver
    }
  }
  throw new Error(`DNS-over-HTTPS failed to resolve ${type} for ${name}`);
}

async function resolveSeedlistSrv(host) {
  const srvName = `_mongodb._tcp.${host}`;
  let records = [];
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
  const options = {};
  try {
    let txt = [];
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

async function resolveMongoUri(uri) {
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
  const pathAndQuery = rest.slice(firstDelim);

  const seed = await resolveSeedlistSrv(host);
  const hosts = seed.hosts.join(',');

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

async function fixNullUsers() {
  let uri = process.env.MONGODB_URI;
  const db = process.env.MONGODB_DB || 'prod_zenfix';
  
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  
  // Resolve SRV URI if needed
  uri = await resolveMongoUri(uri);
  console.log('Resolved URI:', uri);
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db(db);
    
    // Fix users collection
    const users = database.collection('zf_users');
    const nullUsers = await users.find({ numeric_id: null }).toArray();
    console.log(`Found ${nullUsers.length} users with null numeric_id`);
    
    if (nullUsers.length > 0) {
      for (const user of nullUsers) {
        console.log(`Deleting user: ${user.username} (${user._id})`);
        await users.deleteOne({ _id: user._id });
      }
      console.log('Deleted all null numeric_id users');
    } else {
      console.log('No null numeric_id users found');
    }
    
    // Fix activity_logs collection
    const activityLogs = database.collection('zf_activity_logs');
    const nullLogs = await activityLogs.find({ numeric_id: null }).toArray();
    console.log(`Found ${nullLogs.length} activity logs with null numeric_id`);
    
    if (nullLogs.length > 0) {
      for (const log of nullLogs) {
        console.log(`Deleting activity log: ${log.action} (${log._id})`);
        await activityLogs.deleteOne({ _id: log._id });
      }
      console.log('Deleted all null numeric_id activity logs');
    } else {
      console.log('No null numeric_id activity logs found');
    }
    
    // Fix other collections that might have the same issue
    const collections = ['zf_tasks', 'zf_videos', 'zf_clients', 'zf_departments', 'zf_notifications', 'zf_approvals', 'zf_video_protocols', 'zf_video_records', 'zf_video_stages', 'zf_monthly_targets'];
    
    for (const collName of collections) {
      const coll = database.collection(collName);
      const nullDocs = await coll.find({ numeric_id: null }).toArray();
      if (nullDocs.length > 0) {
        console.log(`Found ${nullDocs.length} documents in ${collName} with null numeric_id`);
        await coll.deleteMany({ numeric_id: null });
        console.log(`Deleted all null numeric_id documents from ${collName}`);
      }
    }
    
    console.log('Done fixing all collections');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixNullUsers();
