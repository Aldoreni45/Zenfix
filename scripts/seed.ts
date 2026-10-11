import { getDb } from '../lib/mongodb/client';
import { hashPassword } from '../lib/auth/password';
import { UserRole, UserStatus, ClientStatus, TaskPriority, TaskStatus, VideoStage, VideoPriority } from '../lib/types/models';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    const db = await getDb();
    
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
      'zf_counters'
    ];
    
    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
    }
    console.log('✅ All collections cleared');
    
    // Reset counters
    console.log('🔄 Resetting counters...');
    await db.collection('zf_counters').deleteMany({});
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
      await db.collection('zf_counters').insertOne({
        sequence_name: sequence,
        last_value: 0
      });
    }
    console.log('✅ Counters reset');
    
    // Seed Departments
    console.log('📁 Seeding departments...');
    const departments = [
      { name: 'Video Production', slug: 'video-production', description: 'Video creation and editing team', is_active: true },
      { name: 'Social Media', slug: 'social-media', description: 'Social media management team', is_active: true },
      { name: 'Management', slug: 'management', description: 'Management and administration', is_active: true },
      { name: 'Sales', slug: 'sales', description: 'Sales and client relations', is_active: true }
    ];
    const deptResults = await db.collection('zf_departments').insertMany(
      departments.map(d => ({
        ...d,
        numeric_id: 0,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );
    const deptIds = deptResults.insertedIds;
    console.log('✅ Departments seeded');
    
    // Seed Users
    console.log('👤 Seeding users...');
    const hashedPassword = await hashPassword('password123');
    const users = [
      { username: 'owner', email: 'owner@zenfix.com', first_name: 'ZenFix', last_name: 'Owner', password: hashedPassword, role: UserRole.OWNER, status: UserStatus.ACTIVE, phone: '+9987654321', department_id: 3, is_active: true, is_staff: true, is_superuser: true },
      { username: 'manager1', email: 'manager1@zenfix.com', first_name: 'John', last_name: 'Manager', password: hashedPassword, role: UserRole.MANAGER, status: UserStatus.ACTIVE, phone: '+9112345678', department_id: 3, is_active: true, is_staff: false, is_superuser: false },
      { username: 'manager2', email: 'manager2@zenfix.com', first_name: 'Jane', last_name: 'Smith', password: hashedPassword, role: UserRole.MANAGER, status: UserStatus.ACTIVE, phone: '+9198765432', department_id: 1, is_active: true, is_staff: false, is_superuser: false },
      { username: 'employee1', email: 'employee1@zenfix.com', first_name: 'Mike', last_name: 'Johnson', password: hashedPassword, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, phone: '+9155555555', department_id: 1, is_active: true, is_staff: false, is_superuser: false },
      { username: 'employee2', email: 'employee2@zenfix.com', first_name: 'Sarah', last_name: 'Williams', password: hashedPassword, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, phone: '+9144444444', department_id: 2, is_active: true, is_staff: false, is_superuser: false },
      { username: 'employee3', email: 'employee3@zenfix.com', first_name: 'David', last_name: 'Brown', password: hashedPassword, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, phone: '+9133333333', department_id: 1, is_active: true, is_staff: false, is_superuser: false },
      { username: 'employee4', email: 'employee4@zenfix.com', first_name: 'Emily', last_name: 'Davis', password: hashedPassword, role: UserRole.EMPLOYEE, status: UserStatus.ACTIVE, phone: '+9122222222', department_id: 2, is_active: true, is_staff: false, is_superuser: false }
    ];
    const userResults = await db.collection('zf_users').insertMany(
      users.map((u, i) => ({
        ...u,
        numeric_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );
    const userIds = userResults.insertedIds;
    console.log('✅ Users seeded');
    
    // Seed Clients
    console.log('🏢 Seeding clients...');
    const clients = [
      { name: 'FitLife Gym', company_name: 'FitLife Gym LLC', contact_person: 'Tom Wilson', email: 'tom@fitlife.com', phone: '+9111111111', website: 'https://fitlife.com', industry: 'Fitness', description: 'Premium gym chain', address: '123 Fitness Street, Mumbai', instagram_username: 'fitlifegym', instagram_url: 'https://instagram.com/fitlifegym', status: ClientStatus.ACTIVE, assigned_manager_id: 2, assigned_team_ids: [4, 5], monthly_video_target: 8, start_date: new Date('2024-01-01') },
      { name: 'TravelAdventures', company_name: 'Travel Adventures Inc', contact_person: 'Lisa Chen', email: 'lisa@traveladventures.com', phone: '+9122222222', website: 'https://traveladventures.com', industry: 'Travel', description: 'Adventure travel company', address: '456 Adventure Road, Delhi', instagram_username: 'traveladventures', instagram_url: 'https://instagram.com/traveladventures', status: ClientStatus.ACTIVE, assigned_manager_id: 3, assigned_team_ids: [6, 7], monthly_video_target: 6, start_date: new Date('2024-02-01') },
      { name: 'FashionForward', company_name: 'Fashion Forward Co', contact_person: 'Alex Rivera', email: 'alex@fashionforward.com', phone: '+9133333333', website: 'https://fashionforward.com', industry: 'Fashion', description: 'Fashion brand', address: '789 Style Avenue, Bangalore', instagram_username: 'fashionforward', instagram_url: 'https://instagram.com/fashionforward', status: ClientStatus.ACTIVE, assigned_manager_id: 2, assigned_team_ids: [4], monthly_video_target: 10, start_date: new Date('2024-03-01') },
      { name: 'FoodieDelights', company_name: 'Foodie Delights Ltd', contact_person: 'Sam Parker', email: 'sam@foodiedelights.com', phone: '+9144444444', website: 'https://foodiedelights.com', industry: 'Food', description: 'Food delivery service', address: '321 Culinary Court, Chennai', instagram_username: 'foodiedelights', instagram_url: 'https://instagram.com/foodiedelights', status: ClientStatus.ACTIVE, assigned_manager_id: 3, assigned_team_ids: [5, 6], monthly_video_target: 5, start_date: new Date('2024-04-01') },
      { name: 'TechStart', company_name: 'TechStart Solutions', contact_person: 'Kevin Lee', email: 'kevin@techstart.com', phone: '+9155555555', website: 'https://techstart.com', industry: 'Technology', description: 'Tech startup', address: '654 Innovation Drive, Hyderabad', instagram_username: 'techstart', instagram_url: 'https://instagram.com/techstart', status: ClientStatus.ACTIVE, assigned_manager_id: 2, assigned_team_ids: [7], monthly_video_target: 4, start_date: new Date('2024-05-01') }
    ];
    const clientResults = await db.collection('zf_clients').insertMany(
      clients.map((c, i) => ({
        ...c,
        numeric_id: i + 1,
        created_by_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );
    const clientIds = clientResults.insertedIds;
    console.log('✅ Clients seeded');
    
    // Seed Tasks
    console.log('📋 Seeding tasks...');
    const tasks = [
      { title: 'Create promotional video', description: 'Create a promotional video for FitLife Gym', client_id: 1, assigned_to_id: 4, assigned_by_id: 2, department_id: 1, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, due_date: new Date('2024-12-20'), estimated_hours: 8, carry_forward_count: 0, rejection_count: 0, task_type: 'video_production', attachments: [] },
      { title: 'Edit Instagram reel', description: 'Edit Instagram reel for TravelAdventures', client_id: 2, assigned_to_id: 5, assigned_by_id: 3, department_id: 2, priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING, due_date: new Date('2024-12-22'), estimated_hours: 4, carry_forward_count: 0, rejection_count: 0, task_type: 'video_editing', attachments: [] },
      { title: 'Shoot product video', description: 'Shoot product video for FashionForward', client_id: 3, assigned_to_id: 6, assigned_by_id: 2, department_id: 1, priority: TaskPriority.HIGH, status: TaskStatus.PENDING, due_date: new Date('2024-12-25'), estimated_hours: 6, carry_forward_count: 0, rejection_count: 0, task_type: 'video_shoot', attachments: [] },
      { title: 'Design social media post', description: 'Design social media post for FoodieDelights', client_id: 4, assigned_to_id: 7, assigned_by_id: 3, department_id: 2, priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, due_date: new Date('2024-12-18'), estimated_hours: 3, carry_forward_count: 0, rejection_count: 0, task_type: 'social_media', attachments: [], completed_at: new Date('2024-12-18') },
      { title: 'Review client feedback', description: 'Review client feedback for TechStart', client_id: 5, assigned_to_id: 4, assigned_by_id: 2, department_id: 1, priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, due_date: new Date('2024-12-23'), estimated_hours: 2, carry_forward_count: 0, rejection_count: 0, task_type: 'review', attachments: [] }
    ];
    const taskResults = await db.collection('zf_tasks').insertMany(
      tasks.map((t, i) => ({
        ...t,
        numeric_id: i + 1,
        task_id: `T-${(i + 1).toString().padStart(6, '0')}`,
        created_by_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );
    const taskIds = taskResults.insertedIds;
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
      spendings.map((s, i) => ({
        ...s,
        numeric_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
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
      income.map((inc, i) => ({
        ...inc,
        numeric_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
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
      salaries.map((s, i) => ({
        ...s,
        numeric_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
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
      employeePayments.map((p, i) => ({
        ...p,
        numeric_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );
    console.log('✅ Employee payments seeded');
    
    // Seed Videos
    console.log('🎬 Seeding videos...');
    const videos = [
      { title: 'FitLife Gym Promo', description: 'Promotional video for FitLife Gym', client_id: 1, assigned_to_id: 4, created_by_id: 1, stage: VideoStage.POSTED, status: VideoStage.POSTED, priority: VideoPriority.HIGH, deadline: new Date('2024-12-15'), shoot_date: new Date('2024-12-05'), edit_due_date: new Date('2024-12-10'), approval_date: new Date('2024-12-12'), posted_date: new Date('2024-12-13'), shooter_id: 4, editor_id: 4, social_media_handler_id: 5, raw_footage_urls: [], final_video_url: 'https://example.com/fitlife.mp4', duration: 60, format: 'MP4', rejection_count: 0, instagram_caption: 'Get fit with FitLife Gym!', instagram_hashtags: ['fitness', 'gym', 'workout'], instagram_post_url: 'https://instagram.com/p/abc123' },
      { title: 'Travel Adventures Reel', description: 'Instagram reel for Travel Adventures', client_id: 2, assigned_to_id: 5, created_by_id: 1, stage: VideoStage.EDITING, status: VideoStage.EDITING, priority: VideoPriority.MEDIUM, deadline: new Date('2024-12-20'), shoot_date: new Date('2024-12-08'), edit_due_date: new Date('2024-12-18'), shooter_id: 6, editor_id: 5, raw_footage_urls: [], duration: 30, format: 'MP4', rejection_count: 0 },
      { title: 'Fashion Forward Campaign', description: 'Brand campaign video for Fashion Forward', client_id: 3, assigned_to_id: 6, created_by_id: 1, stage: VideoStage.SHOOTING, status: VideoStage.SHOOTING, priority: VideoPriority.HIGH, deadline: new Date('2024-12-25'), shoot_date: new Date('2024-12-15'), edit_due_date: new Date('2024-12-22'), shooter_id: 6, raw_footage_urls: [], duration: 90, format: 'MP4', rejection_count: 0 },
      { title: 'Foodie Delights Content', description: 'Content video for Foodie Delights', client_id: 4, assigned_to_id: 7, created_by_id: 1, stage: VideoStage.INTERNAL_REVIEW, status: VideoStage.INTERNAL_REVIEW, priority: VideoPriority.LOW, deadline: new Date('2024-12-18'), shoot_date: new Date('2024-12-10'), edit_due_date: new Date('2024-12-15'), shooter_id: 4, editor_id: 7, raw_footage_urls: [], duration: 45, format: 'MP4', rejection_count: 0 },
      { title: 'TechStart Product Launch', description: 'Product launch video for TechStart', client_id: 5, assigned_to_id: 4, created_by_id: 1, stage: VideoStage.IDEA, status: VideoStage.IDEA, priority: VideoPriority.MEDIUM, deadline: new Date('2024-12-30'), raw_footage_urls: [], duration: 120, format: 'MP4', rejection_count: 0 }
    ];
    const videoResults = await db.collection('zf_videos').insertMany(
      videos.map((v, i) => ({
        ...v,
        numeric_id: i + 1,
        video_code: `ZF-${(i + 1).toString().padStart(4, '0')}`,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );
    const videoIds = videoResults.insertedIds;
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
      monthlyTargets.map((t, i) => ({
        ...t,
        numeric_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
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
      notifications.map((n, i) => ({
        ...n,
        numeric_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
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
      activityLogs.map((log, i) => ({
        ...log,
        numeric_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
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
