/**
 * ZenFix MongoDB clear data script.
 *
 *   node scripts/clear-data.mjs
 *
 * Connects to the MongoDB instance in MONGODB_URI (database from MONGODB_DB,
 * default "prod_zenfix") and clears all data from all collections.
 *
 * The script is plain ESM JS so it can be executed directly with Node without a
 * TS loader. It reads .env automatically (dotenv-style) when present.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dns from 'node:dns';
import { MongoClient } from 'mongodb';

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, '.env');

function loadEnv() {
  if (!existsSync(ENV_PATH)) return;
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

loadEnv();

const URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB || 'prod_zenfix';

if (!URI) {
  console.error('MONGODB_URI is not set. Add it to your .env file.');
  process.exit(1);
}

// --- SRV fallback (see lib/mongodb.ts) -----------------------------------
async function resolveDirectUri(uri) {
  if (!uri.startsWith('mongodb+srv://')) return uri;
  const stripped = uri.slice('mongodb+srv://'.length);
  const atIndex = stripped.lastIndexOf('@');
  const credentials = atIndex === -1 ? '' : stripped.slice(0, atIndex + 1);
  const rest = atIndex === -1 ? stripped : stripped.slice(atIndex + 1);
  const slash = rest.indexOf('/');
  const q = rest.indexOf('?');
  const firstDelim = Math.min(slash === -1 ? rest.length : slash, q === -1 ? rest.length : q);
  const host = rest.slice(0, firstDelim);
  const pathAndQuery = rest.slice(firstDelim);

  let srv;
  try {
    srv = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
  } catch {
    const doh = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(`_mongodb._tcp.${host}`)}&type=SRV`,
      { headers: { accept: 'application/dns-json' } }
    ).then((r) => r.json());
    srv = (doh.Answer || [])
      .filter((a) => a.type === 33)
      .map((a) => {
        const [priority, weight, port, target] = a.data.split(/\s+/);
        return { priority: Number(priority), weight: Number(weight), port: Number(port), target: target.replace(/\.$/, '') };
      });
  }
  if (!srv || srv.length === 0) throw new Error(`No SRV records for ${host}`);
  const hosts = srv.slice().sort((a, b) => a.priority - b.priority).map((r) => `${r.target}:${r.port}`).join(',');

  let opts = { tls: 'true' };
  try {
    let txt;
    try {
      txt = await dns.promises.resolveTxt(host);
    } catch {
      const doh = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=TXT`,
        { headers: { accept: 'application/dns-json' } }
      ).then((r) => r.json());
      txt = (doh.Answer || [])
        .filter((a) => a.type === 16)
        .map((a) => a.data.replace(/^"|"$/g, '').split('&'));
    }
    const merged = {};
    for (const parts of txt) for (const part of parts) {
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      merged[part.slice(0, eq)] = part.slice(eq + 1);
    }
    opts = { ...merged, tls: 'true' };
  } catch {
    /* best effort */
  }

  const qsPath = pathAndQuery.startsWith('/')
    ? pathAndQuery.slice(0, pathAndQuery.indexOf('?') === -1 ? pathAndQuery.length : pathAndQuery.indexOf('?'))
    : '';
  const originalQuery = pathAndQuery.includes('?')
    ? pathAndQuery.slice(pathAndQuery.indexOf('?') + 1) + '&'
    : '';
  const params = new URLSearchParams(originalQuery);
  for (const [k, v] of Object.entries(opts)) if (v && !params.has(k)) params.set(k, v);
  if (!params.has('retryWrites')) params.set('retryWrites', 'true');

  return `mongodb://${credentials}${hosts}${qsPath}?${params.toString()}`;
}

const collections = [
  'zf_users',
  'zf_departments',
  'zf_clients',
  'zf_tasks',
  'zf_task_comments',
  'zf_spendings',
  'zf_income',
  'zf_salaries',
  'zf_employee_payments',
  'zf_activity_logs',
  'zf_approvals',
  'zf_monthly_targets',
  'zf_notifications',
  'zf_videos',
  'zf_video_assets',
  'zf_social_posts',
  'zf_video_stages',
  'zf_video_records',
  'zf_video_protocols',
  'zenfix_sequences'
];

(async () => {
  console.log('🗑️  Clearing all data from database...');
  
  const directUri = await resolveDirectUri(URI);
  const client = new MongoClient(directUri, { serverSelectionTimeoutMS: 15_000 });

  try {
    await client.connect();
    const db = client.db(DB);
    
    console.log(`✅ Connected to ${DB}`);
    
    let totalDeleted = 0;
    for (const collection of collections) {
      const result = await db.collection(collection).deleteMany({});
      console.log(`✅ Cleared ${collection}: ${result.deletedCount} documents`);
      totalDeleted += result.deletedCount;
    }
    
    // Reset all counters to 0
    console.log('🔄 Resetting counters...');
    const counterSequences = [
      'users.user',
      'clients.client',
      'departments.department',
      'tasks.task',
      'tasks.taskcomment',
      'spendings.spending',
      'income',
      'salary',
      'employee-payments',
      'activity_logs.activitylog',
      'approvals.approval',
      'targets.monthlytarget',
      'notifications.notification',
      'videos.video',
      'videos.videoasset',
      'videos.socialpost',
      'video-protocol.stages',
      'video-protocol.records',
      'video-protocol.protocols'
    ];
    
    for (const sequence of counterSequences) {
      await db.collection('zenfix_sequences').updateOne(
        { _id: sequence },
        { $set: { value: 0 } },
        { upsert: true }
      );
    }
    console.log('✅ Counters reset');
    
    console.log(`\n🎉 All data cleared successfully! Total: ${totalDeleted} documents`);
  } catch (err) {
    console.error('❌ Clear failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
