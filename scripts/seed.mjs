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
const DB = 'prod_zenfix';

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
  {
    username: 'sarah',
    email: 'sarah@zenfix.io',
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone: '+1 555 0103',
    password: 'sarah123',
    role: 'manager',
    role_name: 'Manager',
    department: 'Production',
    department_name: 'Production',
    status: 'active',
    status_name: 'Active',
    avatar: '',
  },
  {
    username: 'mike',
    email: 'mike@zenfix.io',
    first_name: 'Mike',
    last_name: 'Williams',
    phone: '+1 555 0104',
    password: 'mike123',
    role: 'employee',
    role_name: 'Employee',
    department: 'Production',
    department_name: 'Production',
    status: 'active',
    status_name: 'Active',
    avatar: '',
  },
  {
    username: 'emma',
    email: 'emma@zenfix.io',
    first_name: 'Emma',
    last_name: 'Davis',
    phone: '+1 555 0105',
    password: 'emma123',
    role: 'employee',
    role_name: 'Employee',
    department: 'Production',
    department_name: 'Production',
    status: 'active',
    status_name: 'Active',
    avatar: '',
  },
  {
    username: 'john',
    email: 'john@zenfix.io',
    first_name: 'John',
    last_name: 'Smith',
    phone: '+1 555 0106',
    password: 'john123',
    role: 'employee',
    role_name: 'Employee',
    department: 'Production',
    department_name: 'Production',
    status: 'active',
    status_name: 'Active',
    avatar: '',
  },
  {
    username: 'lisa',
    email: 'lisa@zenfix.io',
    first_name: 'Lisa',
    last_name: 'Brown',
    phone: '+1 555 0107',
    password: 'lisa123',
    role: 'manager',
    role_name: 'Manager',
    department: 'Client Success',
    department_name: 'Client Success',
    status: 'active',
    status_name: 'Active',
    avatar: '',
  },
];

const DEMO_DEPARTMENTS = [
  { name: 'Management', description: 'Executive management team' },
  { name: 'Client Success', description: 'Client relationship management' },
  { name: 'Production', description: 'Video production team' },
  { name: 'Marketing', description: 'Marketing and social media' },
  { name: 'Design', description: 'Creative design team' },
];

const DEMO_CLIENTS = [
  { name: 'TechCorp Inc.', industry: 'Technology', contact: 'John Doe', email: 'john@techcorp.com', phone: '+1 555 1001' },
  { name: 'Global Brands LLC', industry: 'Retail', contact: 'Jane Smith', email: 'jane@globalbrands.com', phone: '+1 555 1002' },
  { name: 'StartupXYZ', industry: 'SaaS', contact: 'Mike Johnson', email: 'mike@startupxyz.com', phone: '+1 555 1003' },
  { name: 'EcoFriendly Co', industry: 'Environment', contact: 'Sarah Green', email: 'sarah@ecofriendly.com', phone: '+1 555 1004' },
  { name: 'FashionForward', industry: 'Fashion', contact: 'Emma Style', email: 'emma@fashionforward.com', phone: '+1 555 1005' },
  { name: 'FoodieDelights', industry: 'Food & Beverage', contact: 'Chef Mario', email: 'mario@foodiedelights.com', phone: '+1 555 1006' },
  { name: 'FitLife Gym', industry: 'Fitness', contact: 'Tom Strong', email: 'tom@fitlife.com', phone: '+1 555 1007' },
  { name: 'TravelAdventures', industry: 'Travel', contact: 'Wanderlust Amy', email: 'amy@traveladventures.com', phone: '+1 555 1008' },
];

const DEMO_TASKS = [
  { title: 'Create product launch video', description: 'Promotional video for new product', priority: 'high', status: 'pending', department: 'Production' },
  { title: 'Edit client testimonial', description: 'Edit and polish testimonial video', priority: 'medium', status: 'in_progress', department: 'Production' },
  { title: 'Design social media graphics', description: 'Create Instagram graphics for campaign', priority: 'high', status: 'pending', department: 'Design' },
  { title: 'Review video analytics', description: 'Analyze video performance metrics', priority: 'low', status: 'completed', department: 'Marketing' },
  { title: 'Shoot interview footage', description: 'On-location interview shoot', priority: 'high', status: 'pending', department: 'Production' },
  { title: 'Color correction for ad', description: 'Color grade commercial advertisement', priority: 'medium', status: 'in_progress', department: 'Production' },
  { title: 'Write video script', description: 'Script for product demo video', priority: 'high', status: 'completed', department: 'Marketing' },
  { title: 'Add subtitles to video', description: 'Captioning for accessibility', priority: 'low', status: 'pending', department: 'Production' },
  { title: 'Client meeting - project review', description: 'Monthly client review meeting', priority: 'medium', status: 'pending', department: 'Client Success' },
  { title: 'Export final video files', description: 'Render and export deliverables', priority: 'high', status: 'in_progress', department: 'Production' },
  { title: 'Create storyboard', description: 'Storyboard for upcoming campaign', priority: 'medium', status: 'pending', department: 'Design' },
  { title: 'Upload videos to platform', description: 'Upload to YouTube and social media', priority: 'high', status: 'completed', department: 'Marketing' },
];

(async () => {
  const directUri = await resolveDirectUri(URI);
  const client = new MongoClient(directUri, { serverSelectionTimeoutMS: 15_000 });
  const now = new Date().toISOString();
  let nextUserId = 1;

  try {
    await client.connect();
    const db = client.db(DB);
    const counters = db.collection('zenfix_sequences');
    const usersCol = db.collection('zf_users');
    const departmentsCol = db.collection('zf_departments');
    const clientsCol = db.collection('zf_clients');
    const tasksCol = db.collection('zf_tasks');
    const activityLogsCol = db.collection('zf_activity_logs');
    const notificationsCol = db.collection('zf_notifications');

    console.log(`Connected to ${DB}`);

    // --- Indexes ------------------------------------------------------------
    await counters.createIndex({ _id: 1 });
    await usersCol.createIndex({ numeric_id: 1 }, { unique: true });
    await usersCol.createIndex({ username: 1 }, { unique: true });
    await usersCol.createIndex({ email: 1 }, { unique: true });
    await departmentsCol.createIndex({ numeric_id: 1 }, { unique: true });
    await departmentsCol.createIndex({ name: 1 }, { unique: true });
    await clientsCol.createIndex({ numeric_id: 1 }, { unique: true });
    await clientsCol.createIndex({ name: 1 }, { unique: true });
    await tasksCol.createIndex({ numeric_id: 1 }, { unique: true });
    await tasksCol.createIndex({ task_id: 1 }, { unique: true });
    await activityLogsCol.createIndex({ numeric_id: 1 }, { unique: true });
    await notificationsCol.createIndex({ numeric_id: 1 }, { unique: true });
    console.log('Indexes ensured.');

    const nextId = async (name) => {
      const c = await counters.findOneAndUpdate(
        { _id: name },
        { $inc: { value: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      return c?.value ?? 1;
    };

    // --- Users ---------------------------------------------------------------
    const passwordRounds = 12;
    for (const u of DEMO_USERS) {
      const existing = await usersCol.findOne({ username: u.username });
      const passwordHash = await bcrypt.hash(u.password, passwordRounds);
      
      const userData = {
        username: u.username,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        password: passwordHash,
        phone: u.phone,
        role: u.role,
        status: 'active',
        department_id: null,
        reports_to_id: null,
        avatar: u.avatar || null,
      };
      
      if (!existing) {
        const numeric_id = await nextId('users.user');
        const doc = {
          ...userData,
          numeric_id,
          is_active: true,
          is_staff: u.role === 'owner',
          is_superuser: u.role === 'owner',
          created_at: new Date(),
          updated_at: new Date(),
        };
        await usersCol.insertOne(doc);
        console.log(`  created user: ${u.username} (id=${numeric_id})`);
      } else {
        await usersCol.updateOne(
          { username: u.username },
          { $set: { ...userData, updated_at: new Date() } }
        );
        console.log(`  refreshed user: ${u.username} (id=${existing.numeric_id})`);
      }
    }

    // --- Departments --------------------------------------------------------
    const departmentMap = {};
    for (const dept of DEMO_DEPARTMENTS) {
      const existing = await departmentsCol.findOne({ name: dept.name });
      if (!existing) {
        const numeric_id = await nextId('departments.department');
        const doc = {
          numeric_id,
          name: dept.name,
          description: dept.description,
          created_at: new Date(),
          updated_at: new Date(),
        };
        await departmentsCol.insertOne(doc);
        departmentMap[dept.name] = numeric_id;
        console.log(`  created department: ${dept.name} (id=${numeric_id})`);
      } else {
        departmentMap[dept.name] = existing.numeric_id;
        console.log(`  refreshed department: ${dept.name} (id=${existing.numeric_id})`);
      }
    }

    // --- Clients ------------------------------------------------------------
    for (const client of DEMO_CLIENTS) {
      const existing = await clientsCol.findOne({ name: client.name });
      if (!existing) {
        const numeric_id = await nextId('clients.client');
        const doc = {
          numeric_id,
          name: client.name,
          industry: client.industry,
          contact_person: client.contact,
          email: client.email,
          phone: client.phone,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        };
        await clientsCol.insertOne(doc);
        console.log(`  created client: ${client.name} (id=${numeric_id})`);
      } else {
        console.log(`  refreshed client: ${client.name} (id=${existing.numeric_id})`);
      }
    }

    // --- Tasks -------------------------------------------------------------
    const userMap = {};
    const users = await usersCol.find({}).toArray();
    users.forEach(u => userMap[u.username] = u.numeric_id);
    const clientDocs = await clientsCol.find({}).toArray();
    const clientMap = {};
    clientDocs.forEach(c => clientMap[c.name] = c.numeric_id);

    for (const task of DEMO_TASKS) {
      const existing = await tasksCol.findOne({ title: task.title });
      if (!existing) {
        const numeric_id = await nextId('tasks.task');
        const task_id = `ZF-TASK-${numeric_id.toString().padStart(4, '0')}`;
        const deptId = departmentMap[task.department] || null;
        const clientId = clientDocs.length > 0 ? clientDocs[Math.floor(Math.random() * clientDocs.length)].numeric_id : null;
        const assignedTo = users.find(u => u.role === 'employee')?.numeric_id || userMap['employee'];
        const createdBy = userMap['admin'];

        const doc = {
          numeric_id,
          task_id,
          title: task.title,
          description: task.description,
          client_id: clientId,
          assigned_to_id: assignedTo,
          assigned_by_id: createdBy,
          created_by_id: createdBy,
          department_id: deptId,
          priority: task.priority,
          status: task.status,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date(),
        };
        await tasksCol.insertOne(doc);
        console.log(`  created task: ${task.title} (id=${numeric_id})`);
      } else {
        console.log(`  refreshed task: ${task.title} (id=${existing.numeric_id})`);
      }
    }

    // --- Activity Logs ------------------------------------------------------
    // Clear existing activity logs to avoid conflicts
    await activityLogsCol.deleteMany({});
    const actions = ['created', 'updated', 'deleted', 'completed', 'assigned'];
    const entities = ['task', 'client', 'user', 'video', 'approval'];
    for (let i = 0; i < 20; i++) {
      const numeric_id = await nextId('activity_logs.activitylog');
      const action = actions[Math.floor(Math.random() * actions.length)];
      const entity = entities[Math.floor(Math.random() * entities.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      
      const doc = {
        numeric_id,
        actor_id: user.numeric_id,
        action,
        entity_type: entity,
        entity_id: Math.floor(Math.random() * 100).toString(),
        description: `${action} ${entity} ${Math.floor(Math.random() * 1000)}`,
        metadata: {},
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      };
      await activityLogsCol.insertOne(doc);
    }
    console.log(`  created 20 activity logs`);

    // --- Notifications ------------------------------------------------------
    const notificationTypes = ['task_assigned', 'task_completed', 'approval_required', 'system_alert'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    for (let i = 0; i < 15; i++) {
      const numeric_id = await nextId('notifications.notification');
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      
      const doc = {
        numeric_id,
        user_id: user.numeric_id,
        type,
        title: `${type.replace('_', ' ').toUpperCase()}`,
        message: `This is a ${type} notification for ${user.first_name}`,
        priority,
        is_read: Math.random() > 0.5,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      };
      await notificationsCol.insertOne(doc);
    }
    console.log(`  created 15 notifications`);

    // Sanity check: verify the admin user can be authenticated.
    const adminUser = await usersCol.findOne({ username: 'admin' });
    const isValid = await bcrypt.compare('admin123', adminUser.password);
    console.log(`  sanity check: admin/admin123 -> ${isValid ? 'OK' : 'FAIL'}`);
    if (!isValid) {
      throw new Error('Admin password verification failed');
    }

    console.log('Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();