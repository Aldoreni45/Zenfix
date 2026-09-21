import { readFileSync } from 'node:fs';
import { MongoClient } from 'mongodb';

function loadEnv() {
  const out = {};
  try {
    const txt = readFileSync('.env', 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {}
  return out;
}

async function doh(name, type) {
  for (const dns of ['https://cloudflare-dns.com/dns-query', 'https://dns.google/resolve']) {
    try {
      const r = await fetch(`${dns}?name=${encodeURIComponent(name)}&type=${type}`, {
        headers: { accept: 'application/dns-json' },
      });
      if (r.status !== 200) continue;
      const j = await r.json();
      if (Array.isArray(j.Answer) && j.Answer.length) return j.Answer;
    } catch {}
  }
  return [];
}

const env = loadEnv();
const uri = env.MONGODB_URI;
const dbName = env.MONGODB_DB;

const srvMatch = uri.match(/^mongodb\+srv:\/\/([^@]+)@([^/]+)\//);
const creds = srvMatch[1];
const srvHost = srvMatch[2];

const srvAnswers = await doh('_mongodb._tcp.' + srvHost, 'SRV');
const srvHosts = srvAnswers.filter((a) => a.type === 33).map((a) => a.data.split(/\s+/).pop().replace(/\.$/, ''));
console.log('SRV hosts:', srvHosts);

const hosts = [];
for (const h of srvHosts) {
  const a = await doh(h, 'A');
  const ips = a.filter((x) => x.type === 1).map((x) => x.data);
  for (const ip of ips) hosts.push({ host: h, ip });
}
console.log('resolved hosts:', hosts.map((h) => `${h.host} (${h.ip})`));

if (!hosts.length) {
  console.log('NO HOSTS RESOLVED');
  process.exit(1);
}

const cs = `mongodb://${creds}@${hosts[0].host}:27017/${dbName}?authSource=admin&replicaSet=atlas-kbf70k-shard-0&tls=true&retryWrites=true`;
const client = new MongoClient(cs, { tls: true });
try {
  await client.connect();
  const db = client.db(dbName);

  const protocols = await db.collection('zf_video_protocols').find({}).sort({ _id: -1 }).limit(100).toArray();
  console.log('\n=== zf_video_protocols (' + protocols.length + ') ===');
  for (const p of protocols) {
    console.log(JSON.stringify({ numeric_id: p.numeric_id, client_id: p.client_id, client_name: p.client_name, month: p.month, year: p.year, status: p.status, target_videos: p.target_videos, workflow_progress: p.workflow_progress }));
  }

  const records = await db.collection('zf_video_records').find({}).sort({ _id: -1 }).limit(50).toArray();
  console.log('\n=== zf_video_records (' + records.length + ' sampled) ===');
  for (const r of records.slice(0, 12)) {
    console.log(JSON.stringify({ numeric_id: r.numeric_id, protocol_id: r.protocol_id, video_number: r.video_number, title: r.title, month: r.month, year: r.year, current_status: r.current_status }));
  }

  const stages = await db.collection('zf_video_stages').find({}).sort({ _id: -1 }).limit(50).toArray();
  console.log('\n=== zf_video_stages (last 8) ===');
  for (const s of stages.slice(0, 8)) {
    console.log(JSON.stringify({ numeric_id: s.numeric_id, video_record_id: s.video_record_id, stage_type: s.stage_type, status: s.status, due_date: s.due_date }));
  }
} catch (e) {
  console.log('CONNECT QUERY ERROR:', e.message);
} finally {
  await client.close();
}