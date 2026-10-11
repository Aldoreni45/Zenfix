import { MongoClient } from 'mongodb';

async function clearData() {
  console.log('🗑️  Clearing all data from database...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  const dbName = process.env.MONGODB_DB || 'prod_zenfix';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db(dbName);
    
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
      const result = await db.collection(collection).deleteMany({});
      console.log(`✅ Cleared ${collection}: ${result.deletedCount} documents`);
    }
    
    console.log('🎉 All data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

clearData()
  .then(() => {
    console.log('✅ Clear completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Clear failed:', error);
    process.exit(1);
  });
