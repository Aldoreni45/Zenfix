/**
 * ZenFix MongoDB full seed script.
 *
 *   node scripts/seed-full.mjs
 *
 * Connects to the MongoDB instance in MONGODB_URI (database from MONGODB_DB,
 * default "prod_zenfix"), clears all data, and seeds with comprehensive mock data.
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

async function seed() {
  console.log('🌱 Starting database seed...');
  
  const directUri = await resolveDirectUri(URI);
  const client = new MongoClient(directUri, { serverSelectionTimeoutMS: 15_000 });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db(DB);
    
    // Clear all collections
    console.log('🗑️  Clearing existing data...');
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
    
    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
    }
    console.log('✅ All collections cleared');
    
    // Reset counters
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
    
    // Helper function to get next ID from counter
    const getNextId = async (sequenceName) => {
      const result = await db.collection('zenfix_sequences').findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { value: 1 } },
        { returnDocument: 'after', upsert: true }
      );
      return result.value;
    };
    
    // Seed Departments
    console.log('📁 Seeding departments...');
    const departments = [
      { name: 'Video Production', slug: 'video-production', description: 'Video creation and editing team', is_active: true },
      { name: 'Social Media', slug: 'social-media', description: 'Social media management team', is_active: true },
      { name: 'Management', slug: 'management', description: 'Management and administration', is_active: true },
      { name: 'Sales', slug: 'sales', description: 'Sales and client relations', is_active: true }
    ];
    const deptResults = await db.collection('zf_departments').insertMany(
      await Promise.all(departments.map(async (d) => ({
        ...d,
        numeric_id: await getNextId('departments.department'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Departments seeded');
    
    // Seed Users
    console.log('👤 Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const users = [
      { username: 'owner', email: 'owner@zenfix.com', first_name: 'ZenFix', last_name: 'Owner', password: hashedPassword, role: 'owner', status: 'active', phone: '+9987654321', department_id: 3, is_active: true, is_staff: true, is_superuser: true },
      { username: 'manager1', email: 'manager1@zenfix.com', first_name: 'John', last_name: 'Manager', password: hashedPassword, role: 'manager', status: 'active', phone: '+9112345678', department_id: 3, is_active: true, is_staff: false, is_superuser: false },
      { username: 'manager2', email: 'manager2@zenfix.com', first_name: 'Jane', last_name: 'Smith', password: hashedPassword, role: 'manager', status: 'active', phone: '+9198765432', department_id: 1, is_active: true, is_staff: false, is_superuser: false },
      { username: 'employee1', email: 'employee1@zenfix.com', first_name: 'Mike', last_name: 'Johnson', password: hashedPassword, role: 'employee', status: 'active', phone: '+9155555555', department_id: 1, is_active: true, is_staff: false, is_superuser: false },
      { username: 'employee2', email: 'employee2@zenfix.com', first_name: 'Sarah', last_name: 'Williams', password: hashedPassword, role: 'employee', status: 'active', phone: '+9144444444', department_id: 2, is_active: true, is_staff: false, is_superuser: false },
      { username: 'employee3', email: 'employee3@zenfix.com', first_name: 'David', last_name: 'Brown', password: hashedPassword, role: 'employee', status: 'active', phone: '+9133333333', department_id: 1, is_active: true, is_staff: false, is_superuser: false },
      { username: 'employee4', email: 'employee4@zenfix.com', first_name: 'Emily', last_name: 'Davis', password: hashedPassword, role: 'employee', status: 'active', phone: '+9122222222', department_id: 2, is_active: true, is_staff: false, is_superuser: false }
    ];
    const userResults = await db.collection('zf_users').insertMany(
      await Promise.all(users.map(async (u) => ({
        ...u,
        numeric_id: await getNextId('users.user'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Users seeded');
    
    // Seed Clients
    console.log('🏢 Seeding clients...');
    const clients = [
      { name: 'FitLife Gym', contact_person: 'Tom Wilson', email: 'tom@fitlife.com', phone: '+1 555 1001', status: 'active', monthly_video_target: 8, assigned_manager_id: 2, assigned_team_ids: [4, 5] },
      { name: 'TravelAdventures', contact_person: 'Lisa Chen', email: 'lisa@traveladventures.com', phone: '+1 555 1002', status: 'active', monthly_video_target: 6, assigned_manager_id: 3, assigned_team_ids: [6, 7] },
      { name: 'FashionForward', contact_person: 'Alex Rivera', email: 'alex@fashionforward.com', phone: '+1 555 1003', status: 'active', monthly_video_target: 10, assigned_manager_id: 2, assigned_team_ids: [4] },
      { name: 'FoodieDelights', contact_person: 'Sam Parker', email: 'sam@foodiedelights.com', phone: '+1 555 1004', status: 'active', monthly_video_target: 5, assigned_manager_id: 3, assigned_team_ids: [5, 6] },
      { name: 'TechStart', contact_person: 'Kevin Lee', email: 'kevin@techstart.com', phone: '+1 555 1005', status: 'inactive', monthly_video_target: 4, assigned_manager_id: 2, assigned_team_ids: [7] }
    ];
    const clientResults = await db.collection('zf_clients').insertMany(
      await Promise.all(clients.map(async (c) => ({
        ...c,
        numeric_id: await getNextId('clients.client'),
        created_by_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Clients seeded');
    
    // Seed Tasks
    console.log('📋 Seeding tasks...');
    const tasks = [
      { title: 'Create promotional video', description: 'Create a promotional video for FitLife Gym', client_id: 1, assigned_to_id: 4, assigned_by_id: 2, department_id: 1, priority: 'high', status: 'in_progress', due_date: new Date('2024-12-20'), estimated_hours: 8, carry_forward_count: 0, rejection_count: 0, task_type: 'video_production', attachments: [] },
      { title: 'Edit Instagram reel', description: 'Edit Instagram reel for TravelAdventures', client_id: 2, assigned_to_id: 5, assigned_by_id: 3, department_id: 2, priority: 'medium', status: 'pending', due_date: new Date('2024-12-22'), estimated_hours: 4, carry_forward_count: 0, rejection_count: 0, task_type: 'video_editing', attachments: [] },
      { title: 'Shoot product video', description: 'Shoot product video for FashionForward', client_id: 3, assigned_to_id: 6, assigned_by_id: 2, department_id: 1, priority: 'high', status: 'pending', due_date: new Date('2024-12-25'), estimated_hours: 6, carry_forward_count: 0, rejection_count: 0, task_type: 'video_shoot', attachments: [] },
      { title: 'Design social media post', description: 'Design social media post for FoodieDelights', client_id: 4, assigned_to_id: 7, assigned_by_id: 3, department_id: 2, priority: 'low', status: 'completed', due_date: new Date('2024-12-18'), estimated_hours: 3, carry_forward_count: 0, rejection_count: 0, task_type: 'social_media', attachments: [], completed_at: new Date('2024-12-18') },
      { title: 'Review client feedback', description: 'Review client feedback for TechStart', client_id: 5, assigned_to_id: 4, assigned_by_id: 2, department_id: 1, priority: 'medium', status: 'in_progress', due_date: new Date('2024-12-23'), estimated_hours: 2, carry_forward_count: 0, rejection_count: 0, task_type: 'review', attachments: [] }
    ];
    const taskResults = await db.collection('zf_tasks').insertMany(
      await Promise.all(tasks.map(async (t, i) => ({
        ...t,
        numeric_id: await getNextId('tasks.task'),
        task_id: `T-${(i + 1).toString().padStart(6, '0')}`,
        created_by_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Tasks seeded');
    
    // Seed Spendings
    console.log('💰 Seeding spendings...');
    const spendings = [
      { client_id: 1, client_name: 'FitLife Gym', employee_id: 4, employee_name: 'Mike Johnson', employee_email: 'employee1@zenfix.com', amount: 23, description: 'Travel to client location', category: 'Travel', location: 'Mumbai', date: new Date('2024-12-11'), created_by: 4, created_by_name: 'Mike Johnson', notes: 'Uber ride', status: 'approved', approved_by: 1, approved_by_name: 'ZenFix Owner', approved_at: new Date('2024-12-11') },
      { client_id: 2, client_name: 'TravelAdventures', employee_id: 4, employee_name: 'Mike Johnson', employee_email: 'employee1@zenfix.com', amount: 245, description: 'Camera equipment rental', category: 'Equipment', location: 'Delhi', date: new Date('2024-12-11'), created_by: 4, created_by_name: 'Mike Johnson', notes: 'Sony camera rental', status: 'approved', approved_by: 1, approved_by_name: 'ZenFix Owner', approved_at: new Date('2024-12-11') },
      { client_id: 3, client_name: 'FashionForward', employee_id: 1, employee_name: 'ZenFix Owner', employee_email: 'owner@zenfix.com', amount: 700, description: 'Lighting equipment purchase', category: 'Equipment', location: 'Bangalore', date: new Date('2024-12-11'), created_by: 1, created_by_name: 'ZenFix Owner', notes: 'LED lights', status: 'approved', approved_by: 1, approved_by_name: 'ZenFix Owner', approved_at: new Date('2024-12-11') },
      { client_id: 4, client_name: 'FoodieDelights', employee_id: 5, employee_name: 'Sarah Williams', employee_email: 'employee2@zenfix.com', amount: 2343, description: 'Travel and accommodation', category: 'Travel', location: 'Chennai', date: new Date('2024-12-06'), created_by: 5, created_by_name: 'Sarah Williams', notes: 'Flight and hotel', status: 'approved', approved_by: 1, approved_by_name: 'ZenFix Owner', approved_at: new Date('2024-12-06') },
      { client_id: 5, client_name: 'TechStart', employee_id: 6, employee_name: 'David Brown', employee_email: 'employee3@zenfix.com', amount: 150, description: 'Software license', category: 'Software', location: 'Hyderabad', date: new Date('2024-12-10'), created_by: 6, created_by_name: 'David Brown', notes: 'Adobe license', status: 'approved', approved_by: 1, approved_by_name: 'ZenFix Owner', approved_at: new Date('2024-12-10') }
    ];
    await db.collection('zf_spendings').insertMany(
      await Promise.all(spendings.map(async (s) => ({
        ...s,
        numeric_id: await getNextId('spendings.spending'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Spendings seeded');
    
    // Seed Income
    console.log('💵 Seeding income...');
    const income = [
      { client_id: 1, client_name: 'FitLife Gym', amount: 100000, description: 'Video production package', category: 'Video Production', income_date: new Date('2024-12-11'), status: 'received', payment_method: 'Bank Transfer', invoice_number: 'INV-001', created_by: 1, created_by_name: 'ZenFix Owner', received_date: new Date('2024-12-11') },
      { client_id: 2, client_name: 'TravelAdventures', amount: 75000, description: 'Social media management', category: 'Social Media', income_date: new Date('2024-12-10'), status: 'received', payment_method: 'Bank Transfer', invoice_number: 'INV-002', created_by: 1, created_by_name: 'ZenFix Owner', received_date: new Date('2024-12-10') },
      { client_id: 3, client_name: 'FashionForward', amount: 120000, description: 'Brand video campaign', category: 'Video Production', income_date: new Date('2024-12-09'), status: 'received', payment_method: 'UPI', invoice_number: 'INV-003', created_by: 1, created_by_name: 'ZenFix Owner', received_date: new Date('2024-12-09') },
      { client_id: 4, client_name: 'FoodieDelights', amount: 50000, description: 'Content creation', category: 'Content Creation', income_date: new Date('2024-12-08'), status: 'received', payment_method: 'Bank Transfer', invoice_number: 'INV-004', created_by: 1, created_by_name: 'ZenFix Owner', received_date: new Date('2024-12-08') },
      { client_id: 5, client_name: 'TechStart', amount: 80000, description: 'Product launch video', category: 'Video Production', income_date: new Date('2024-12-07'), status: 'received', payment_method: 'Bank Transfer', invoice_number: 'INV-005', created_by: 1, created_by_name: 'ZenFix Owner', received_date: new Date('2024-12-07') }
    ];
    await db.collection('zf_income').insertMany(
      await Promise.all(income.map(async (inc) => ({
        ...inc,
        numeric_id: await getNextId('income'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Income seeded');
    
    // Seed Salaries
    console.log('💼 Seeding salaries...');
    const salaries = [
      { employee_id: 4, employee_name: 'Mike Johnson', employee_email: 'employee1@zenfix.com', amount: 50000, month: '2024-12', status: 'paid', paid_date: new Date('2024-12-01'), notes: 'December salary', created_by: 1, created_by_name: 'ZenFix Owner' },
      { employee_id: 5, employee_name: 'Sarah Williams', employee_email: 'employee2@zenfix.com', amount: 45000, month: '2024-12', status: 'paid', paid_date: new Date('2024-12-01'), notes: 'December salary', created_by: 1, created_by_name: 'ZenFix Owner' },
      { employee_id: 6, employee_name: 'David Brown', employee_email: 'employee3@zenfix.com', amount: 48000, month: '2024-12', status: 'paid', paid_date: new Date('2024-12-01'), notes: 'December salary', created_by: 1, created_by_name: 'ZenFix Owner' },
      { employee_id: 7, employee_name: 'Emily Davis', employee_email: 'employee4@zenfix.com', amount: 42000, month: '2024-12', status: 'paid', paid_date: new Date('2024-12-01'), notes: 'December salary', created_by: 1, created_by_name: 'ZenFix Owner' },
      { employee_id: 4, employee_name: 'Mike Johnson', employee_email: 'employee1@zenfix.com', amount: 50000, month: '2024-11', status: 'paid', paid_date: new Date('2024-11-01'), notes: 'November salary', created_by: 1, created_by_name: 'ZenFix Owner' },
      { employee_id: 5, employee_name: 'Sarah Williams', employee_email: 'employee2@zenfix.com', amount: 45000, month: '2024-11', status: 'paid', paid_date: new Date('2024-11-01'), notes: 'November salary', created_by: 1, created_by_name: 'ZenFix Owner' }
    ];
    await db.collection('zf_salaries').insertMany(
      await Promise.all(salaries.map(async (s) => ({
        ...s,
        numeric_id: await getNextId('salary'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Salaries seeded');
    
    // Seed Employee Payments
    console.log('💳 Seeding employee payments...');
    const employeePayments = [
      { employee_id: 4, employee_name: 'Mike Johnson', employee_email: 'employee1@zenfix.com', total_spending: 268, amount_paid: 268, amount_pending: 0, status: 'completed', payment_date: new Date('2024-12-11'), notes: 'Paid from spending summary', created_by: 1, created_by_name: 'ZenFix Owner' },
      { employee_id: 1, employee_name: 'ZenFix Owner', employee_email: 'owner@zenfix.com', total_spending: 700, amount_paid: 700, amount_pending: 0, status: 'completed', payment_date: new Date('2024-12-11'), notes: 'Paid from spending summary', created_by: 1, created_by_name: 'ZenFix Owner' },
      { employee_id: 5, employee_name: 'Sarah Williams', employee_email: 'employee2@zenfix.com', total_spending: 2343, amount_paid: 2343, amount_pending: 0, status: 'completed', payment_date: new Date('2024-12-11'), notes: 'Paid from spending summary', created_by: 1, created_by_name: 'ZenFix Owner' },
      { employee_id: 6, employee_name: 'David Brown', employee_email: 'employee3@zenfix.com', total_spending: 150, amount_paid: 150, amount_pending: 0, status: 'completed', payment_date: new Date('2024-12-11'), notes: 'Paid from spending summary', created_by: 1, created_by_name: 'ZenFix Owner' }
    ];
    await db.collection('zf_employee_payments').insertMany(
      await Promise.all(employeePayments.map(async (p) => ({
        ...p,
        numeric_id: await getNextId('employee-payments'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Employee payments seeded');
    
    // Seed Videos
    console.log('🎬 Seeding videos...');
    const videos = [
      { title: 'FitLife Gym Promo', description: 'Promotional video for FitLife Gym', client_id: 1, assigned_to_id: 4, created_by_id: 1, stage: 'posted', status: 'posted', priority: 'high', deadline: new Date('2024-12-15'), shoot_date: new Date('2024-12-05'), edit_due_date: new Date('2024-12-10'), approval_date: new Date('2024-12-12'), posted_date: new Date('2024-12-13'), shooter_id: 4, editor_id: 4, social_media_handler_id: 5, raw_footage_urls: [], final_video_url: 'https://example.com/fitlife.mp4', duration: 60, format: 'MP4', rejection_count: 0, instagram_caption: 'Get fit with FitLife Gym!', instagram_hashtags: ['fitness', 'gym', 'workout'], instagram_post_url: 'https://instagram.com/p/abc123' },
      { title: 'Travel Adventures Reel', description: 'Instagram reel for Travel Adventures', client_id: 2, assigned_to_id: 5, created_by_id: 1, stage: 'editing', status: 'editing', priority: 'medium', deadline: new Date('2024-12-20'), shoot_date: new Date('2024-12-08'), edit_due_date: new Date('2024-12-18'), shooter_id: 6, editor_id: 5, raw_footage_urls: [], duration: 30, format: 'MP4', rejection_count: 0 },
      { title: 'Fashion Forward Campaign', description: 'Brand campaign video for Fashion Forward', client_id: 3, assigned_to_id: 6, created_by_id: 1, stage: 'shooting', status: 'shooting', priority: 'high', deadline: new Date('2024-12-25'), shoot_date: new Date('2024-12-15'), edit_due_date: new Date('2024-12-22'), shooter_id: 6, raw_footage_urls: [], duration: 90, format: 'MP4', rejection_count: 0 },
      { title: 'Foodie Delights Content', description: 'Content video for Foodie Delights', client_id: 4, assigned_to_id: 7, created_by_id: 1, stage: 'internal_review', status: 'internal_review', priority: 'low', deadline: new Date('2024-12-18'), shoot_date: new Date('2024-12-10'), edit_due_date: new Date('2024-12-15'), shooter_id: 4, editor_id: 7, raw_footage_urls: [], duration: 45, format: 'MP4', rejection_count: 0 },
      { title: 'TechStart Product Launch', description: 'Product launch video for TechStart', client_id: 5, assigned_to_id: 4, created_by_id: 1, stage: 'idea', status: 'idea', priority: 'medium', deadline: new Date('2024-12-30'), raw_footage_urls: [], duration: 120, format: 'MP4', rejection_count: 0 }
    ];
    const videoResults = await db.collection('zf_videos').insertMany(
      await Promise.all(videos.map(async (v, i) => ({
        ...v,
        numeric_id: await getNextId('videos.video'),
        video_code: `ZF-${(i + 1).toString().padStart(4, '0')}`,
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Videos seeded');
    
    // Seed Monthly Targets
    console.log('🎯 Seeding monthly targets...');
    const monthlyTargets = [
      { user_id: 4, month: 12, year: 2024, target_type: 'videos_target', target_value: 20, achieved_value: 15, target_videos: 20, completed_videos: 15, posted_videos: 12, pending_videos: 3, in_production_videos: 2, waiting_approval_videos: 1, created_by_id: 1 },
      { user_id: 5, month: 12, year: 2024, target_type: 'videos_target', target_value: 15, achieved_value: 10, target_videos: 15, completed_videos: 10, posted_videos: 8, pending_videos: 2, in_production_videos: 1, waiting_approval_videos: 1, created_by_id: 1 },
      { user_id: 6, month: 12, year: 2024, target_type: 'videos_target', target_value: 18, achieved_value: 12, target_videos: 18, completed_videos: 12, posted_videos: 10, pending_videos: 2, in_production_videos: 2, waiting_approval_videos: 0, created_by_id: 1 },
      { user_id: 7, month: 12, year: 2024, target_type: 'videos_target', target_value: 12, achieved_value: 8, target_videos: 12, completed_videos: 8, posted_videos: 6, pending_videos: 2, in_production_videos: 1, waiting_approval_videos: 1, created_by_id: 1 },
      { client_id: 1, month: 12, year: 2024, target_type: 'videos_target', target_value: 8, achieved_value: 6, target_videos: 8, completed_videos: 6, posted_videos: 5, pending_videos: 1, in_production_videos: 1, waiting_approval_videos: 0, created_by_id: 1 }
    ];
    await db.collection('zf_monthly_targets').insertMany(
      await Promise.all(monthlyTargets.map(async (t) => ({
        ...t,
        numeric_id: await getNextId('targets.monthlytarget'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Monthly targets seeded');
    
    // Seed Notifications
    console.log('🔔 Seeding notifications...');
    const notifications = [
      { recipient_id: 4, notification_type: 'task_assigned', title: 'New Task Assigned', message: 'You have been assigned a new task: Create promotional video', is_read: false, related_object_type: 'task', related_object_id: '1', link: '/tasks/1', priority: 'high' },
      { recipient_id: 5, notification_type: 'task_assigned', title: 'New Task Assigned', message: 'You have been assigned a new task: Edit Instagram reel', is_read: false, related_object_type: 'task', related_object_id: '2', link: '/tasks/2', priority: 'medium' },
      { recipient_id: 6, notification_type: 'task_assigned', title: 'New Task Assigned', message: 'You have been assigned a new task: Shoot product video', is_read: false, related_object_type: 'task', related_object_id: '3', link: '/tasks/3', priority: 'high' },
      { recipient_id: 2, notification_type: 'task_completed', title: 'Task Completed', message: 'Task completed: Design social media post', is_read: true, related_object_type: 'task', related_object_id: '4', link: '/tasks/4', priority: 'low', read_at: new Date() },
      { recipient_id: 4, notification_type: 'approval_required', title: 'Approval Required', message: 'Your task requires approval: Review client feedback', is_read: false, related_object_type: 'task', related_object_id: '5', link: '/tasks/5', priority: 'medium' }
    ];
    await db.collection('zf_notifications').insertMany(
      await Promise.all(notifications.map(async (n) => ({
        ...n,
        numeric_id: await getNextId('notifications.notification'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Notifications seeded');
    
    // Seed Activity Logs
    console.log('📝 Seeding activity logs...');
    const activityLogs = [
      { actor_id: 1, action: 'created', entity_type: 'user', entity_id: '1', description: 'Created user: owner', metadata: { username: 'owner' } },
      { actor_id: 1, action: 'created', entity_type: 'client', entity_id: '1', description: 'Created client: FitLife Gym', metadata: { client_name: 'FitLife Gym' } },
      { actor_id: 4, action: 'created', entity_type: 'spending', entity_id: '1', description: 'Created spending: Travel to client location', metadata: { amount: 23 } },
      { actor_id: 1, action: 'approved', entity_type: 'spending', entity_id: '1', description: 'Approved spending request', metadata: { amount: 23 } },
      { actor_id: 1, action: 'created', entity_type: 'employee_payment', entity_id: '1', description: 'Created employee payment for Mike Johnson', metadata: { amount: 268 } }
    ];
    await db.collection('zf_activity_logs').insertMany(
      await Promise.all(activityLogs.map(async (log) => ({
        ...log,
        numeric_id: await getNextId('activity_logs.activitylog'),
        created_at: new Date(),
        updated_at: new Date()
      })))
    );
    console.log('✅ Activity logs seeded');
    
    console.log('🎉 Database seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Clients: ${clients.length}`);
    console.log(`- Tasks: ${tasks.length}`);
    console.log(`- Spendings: ${spendings.length}`);
    console.log(`- Income: ${income.length}`);
    console.log(`- Salaries: ${salaries.length}`);
    console.log(`- Employee Payments: ${employeePayments.length}`);
    console.log(`- Videos: ${videos.length}`);
    console.log(`- Monthly Targets: ${monthlyTargets.length}`);
    console.log(`- Notifications: ${notifications.length}`);
    console.log(`- Activity Logs: ${activityLogs.length}`);
    
    console.log('\n🔐 Default credentials:');
    console.log('Username: owner');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.close();
  }
}

seed()
  .then(() => {
    console.log('✅ Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
