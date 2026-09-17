/**
 * ZenFix MongoDB seed script.
 *
 *   npm run seed
 *
 * Connects to the MongoDB instance in MONGODB_URI (database from MONGODB_DB,
 * default "zenfix"), ensures indexes, and upserts the initial demo users plus a
 * small amount of sample data so the dashboard has content on first run.
 *
 * The script is plain ESM JS so it can be executed directly with Node without a
 * TS loader. It reads .env automatically (dotenv-style) when present.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dns from 'node:dns';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

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
const DB = process.env.MONGODB_DB || 'zenfix';
const COLLECTION = 'data';

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

const DEMO_USERS = [
  {
    username: 'admin',
    email: 'admin@zenfix.io',
    first_name: 'ZenFix',
    last_name: 'Owner',
    phone: '+1 555 0100',
    password: 'admin123',
    role: 'owner',
    role_name: 'Owner',
    department: 'Management',
    department_name: 'Management',
    status: 'active',
    status_name: 'Active',
    avatar: '',
  },
  {
    username: 'manager',
    email: 'manager@zenfix.io',
    first_name: 'Manager',
    last_name: 'Demo',
    phone: '+1 555 0101',
    password: 'manager123',
    role: 'manager',
    role_name: 'Manager',
    department: 'Client Success',
    department_name: 'Client Success',
    status: 'active',
    status_name: 'Active',
    avatar: '',
  },
  {
    username: 'employee',
    email: 'employee@zenfix.io',
    first_name: 'Employee',
    last_name: 'Demo',
    phone: '+1 555 0102',
    password: 'employee123',
    role: 'employee',
    role_name: 'Employee',
    department: 'Production',
    department_name: 'Production',
    status: 'active',
    status_name: 'Active',
    avatar: '',
  },
];

(async () => {
  const directUri = await resolveDirectUri(URI);
  const client = new MongoClient(directUri, { serverSelectionTimeoutMS: 15_000 });
  const now = new Date().toISOString();
  let nextUserId = 1;

  try {
    await client.connect();
    const db = client.db(DB);
    const col = db.collection(COLLECTION);

    console.log(`Connected to ${DB}.${COLLECTION}`);

    // --- Indexes ------------------------------------------------------------
    // Counters live in a dedicated collection so they never collide with the
    // unique { entity, id } index on the data collection.
    const counters = db.collection('counters');

    // --- Indexes ------------------------------------------------------------
    // Drop an obsolete index that conflicts with entity documents (created by
    // an earlier version of the seed and no longer needed).
    try {
      await col.dropIndex('entity_1_key_1');
      console.log('Dropped obsolete index entity_1_key_1.');
    } catch {
      /* index does not exist */
    }
    await col.createIndex({ entity: 1, id: 1 }, { unique: true });
    // Usernames must be unique among users only. Use a PARTIAL index so that
    // documents that have no `username` (videos, clients, tasks, ...) never
    // collide on a null value, which a plain sparse compound index would.
    try {
      await col.dropIndex('entity_1_username_1');
    } catch {
      /* never created or already replaced */
    }
    await col.createIndex(
      { entity: 1, username: 1 },
      { unique: true, partialFilterExpression: { entity: 'users', username: { $type: 'string' } } }
    );
    await col.createIndex({ entity: 1, status: 1 });
    await col.createIndex({ entity: 1, receiver: 1, read: 1 });
    await col.createIndex({ entity: 1, due_date: 1, status: 1 });
    console.log('Indexes ensured.');

    // Self-heal: remove any documents that earlier buggy seeds left without a
    // numeric id (they would collide with the unique { entity, id } index) as
    // well as the legacy inline counters stored in the data collection.
    const entityNames = [
      'users', 'clients', 'monthly-targets', 'videos', 'video-assets',
      'tasks', 'approvals', 'social-posts', 'activity-logs', 'notifications',
    ];
    const healed = await col.deleteMany({
      entity: { $in: entityNames },
      $or: [{ id: { $exists: false } }, { id: null }],
    });
    // Drop any plaintext password field that an earlier seed may have stored.
    await col.updateMany({ entity: 'users' }, { $unset: { password: '' } });
    await col.deleteMany({ entity: '__counter__' });
    if (healed.deletedCount > 0) console.log(`  cleaned ${healed.deletedCount} corrupt doc(s)`);
    await counters.deleteMany({ _id: { $nin: entityNames } });

    const nextId = async (name) => {
      const c = await counters.findOneAndUpdate(
        { _id: name },
        { $inc: { value: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      return c?.value ?? 1;
    };
    const setCounterAtLeast = async (name, minValue) => {
      await counters.updateOne({ _id: name }, { $max: { value: minValue } }, { upsert: true });
    };

    // --- Users ---------------------------------------------------------------
    const passwordRounds = 12;
    let nextUserId = 1;
    for (const u of DEMO_USERS) {
      const existing = await col.findOne({ entity: 'users', username: u.username });
      const passwordHash = await bcrypt.hash(u.password, passwordRounds);
      const { password: _plain, ...userData } = u;
      if (!existing) {
        await col.insertOne({
          entity: 'users',
          id: nextUserId,
          ...userData,
          passwordHash,
          full_name: `${u.first_name} ${u.last_name}`.trim(),
          last_login: null,
          created_at: now,
          updated_at: now,
        });
        console.log(`  created user: ${u.username} (id=${nextUserId}, role=${u.role})`);
      } else {
        // Always re-hash so the password is up to date after deployment.
        await col.updateOne(
          { _id: existing._id },
          { $set: { passwordHash, updated_at: now } }
        );
        console.log(`  refreshed user: ${u.username} (id=${existing.id})`);
      }
      nextUserId += 1;
    }
    // Keep the id counter monotonic regardless of which users already existed.
    await setCounterAtLeast('users', nextUserId - 1);

    // Verify we can authenticate the first user (quick sanity check).
    const admin = await col.findOne({ entity: 'users', username: 'admin' });
    if (!admin) throw new Error('Failed to seed admin user');
    const ok = await bcrypt.compare('admin123', admin.passwordHash);
    console.log(`  sanity check: admin/admin123 -> ${ok ? 'OK' : 'FAILED'}`);

    // --- Sample data (only if the dashboard collections are empty) -----------
    const sampleClients = [
      { name: 'Alpha Studios', company_name: 'Alpha Studios LLC', contact_person: 'Sarah Chen', phone: '+1 555 0201', email: 'sarah@alphastudios.com', instagram_username: 'alphastudios', instagram_url: 'https://instagram.com/alphastudios', status: 'active', status_name: 'Active', assigned_manager: 2, manager_name: 'Manager Demo', manager_email: 'manager@zenfix.io', notes: 'Monthly retention package.', current_month_target: { year: new Date().getFullYear(), month: new Date().getMonth() + 1, target_videos: 8, completed_videos: 3, posted_videos: 2, progress_percentage: 38 } },
      { name: 'Bright Realty', company_name: 'Bright Realty Group', contact_person: 'Marcus Reed', phone: '+1 555 0202', email: 'marcus@brightrealty.com', instagram_username: 'brightrealty', instagram_url: 'https://instagram.com/brightrealty', status: 'active', status_name: 'Active', assigned_manager: 2, manager_name: 'Manager Demo', manager_email: 'manager@zenfix.io', notes: 'Quad-weekly video drops.', current_month_target: { year: new Date().getFullYear(), month: new Date().getMonth() + 1, target_videos: 12, completed_videos: 5, posted_videos: 4, progress_percentage: 42 } },
      { name: 'Nova Fitness', company_name: 'Nova Fitness Clubs', contact_person: 'Elena Gomez', phone: '+1 555 0203', email: 'elena@novafitness.com', instagram_username: 'novafitness', instagram_url: 'https://instagram.com/novafitness', status: 'active', status_name: 'Active', assigned_manager: 2, manager_name: 'Manager Demo', manager_email: 'manager@zenfix.io', notes: 'Reels heavy.', current_month_target: { year: new Date().getFullYear(), month: new Date().getMonth() + 1, target_videos: 10, completed_videos: 2, posted_videos: 1, progress_percentage: 20 } },
    ];

    const taskCount = await col.countDocuments({ entity: 'tasks' });
    if (taskCount > 0) {
      console.log('Sample tasks exist — skipping sample data.');
    } else {
      const clientColl = (await col.countDocuments({ entity: 'clients' })) === 0;
      const videoColl = (await col.countDocuments({ entity: 'videos' })) === 0;

      if (clientColl) {
        for (let i = 0; i < sampleClients.length; i += 1) {
          const id = await nextId('clients');
          await col.insertOne({
            entity: 'clients',
            id,
            created_at: now,
            updated_at: now,
            ...sampleClients[i],
          });
          console.log(`  created client: ${sampleClients[i].name} (id=${id})`);
        }
      }

      if (videoColl) {
        const baseVideos = [
          { title: 'Alpha Studio Tour — Reel', client: 1, client_name: 'Alpha Studios', status: 'approved', priority: 'high', shooter: 3, editor: 3 },
          { title: 'Bright Realty — Spring Listings', client: 2, client_name: 'Bright Realty', status: 'in_progress', priority: 'medium', shooter: 3, editor: 3 },
          { title: 'Nova Fitness — January Intros', client: 3, client_name: 'Nova Fitness', status: 'waiting_approval', priority: 'high', shooter: 3, editor: 3 },
        ];
        for (const v of baseVideos) {
          const id = await nextId('videos');
          await col.insertOne({
            entity: 'videos',
            id,
            video_code: `ZF-${String(id).padStart(4, '0')}`,
            ...v,
            status_name: v.status.split('_').map((s) => s[0].toUpperCase() + s.slice(1)).join(' '),
            priority_name: v.priority[0].toUpperCase() + v.priority.slice(1),
            shooter_name: 'Employee Demo',
            editor_name: 'Employee Demo',
            is_overdue: false,
            created_at: now,
            updated_at: now,
          });
          console.log(`  created video: ${v.title} (id=${id})`);
        }
      }

      const taskSamples = [
        { task_type: 'shooting', task_type_name: 'Shooting', title: 'Shoot Alpha Studio reel', description: 'Capture b-roll for the studio tour.', priority: 'high', priority_name: 'High', status: 'completed', status_name: 'Completed', assigned_to: 3, assigned_to_name: 'Employee Demo', assigned_manager: 2, assigned_manager_name: 'Manager Demo', created_by: 1, created_by_name: 'ZenFix Owner', client: 1, client_name: 'Alpha Studios', video: 1, video_code: 'ZF-0001', due_date: todayPlus(0), estimated_hours: 3, actual_hours: 2.5, task_id: 'T-1001', is_overdue: false },
        { task_type: 'editing', task_type_name: 'Editing', title: 'Edit Bright Realty listings', description: 'Cut highlight reel for the spring campaign.', priority: 'medium', priority_name: 'Medium', status: 'in_progress', status_name: 'In Progress', assigned_to: 3, assigned_to_name: 'Employee Demo', assigned_manager: 2, assigned_manager_name: 'Manager Demo', created_by: 1, created_by_name: 'ZenFix Owner', client: 2, client_name: 'Bright Realty', video: 2, video_code: 'ZF-0002', due_date: todayPlus(1), estimated_hours: 4, task_id: 'T-1002', is_overdue: false },
        { task_type: 'approval', task_type_name: 'Approval', title: 'Send Nova Fitness for approval', description: 'Client review for the new intros.', priority: 'high', priority_name: 'High', status: 'pending', status_name: 'Pending', assigned_to: 2, assigned_to_name: 'Manager Demo', assigned_manager: 2, assigned_manager_name: 'Manager Demo', created_by: 1, created_by_name: 'ZenFix Owner', client: 3, client_name: 'Nova Fitness', video: 3, video_code: 'ZF-0003', due_date: todayPlus(-2), estimated_hours: 1, task_id: 'T-1003', is_overdue: true },
      ];
      for (const t of taskSamples) {
        const id = await nextId('tasks');
        await col.insertOne({
          entity: 'tasks',
          id,
          ...t,
          due_time: null,
          attachments: [],
          comments: [],
          created_at: now,
          updated_at: now,
        });
        console.log(`  created task: ${t.title} (id=${id})`);
      }
    }

    console.log('Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}