import dotenv from 'dotenv';

// Load environment variables before importing anything else
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Task from '../models/Task';
import Department from '../models/Department';

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Task.deleteMany({});
    await Department.deleteMany({});
    console.log('Existing data cleared');

    // Create Departments
    console.log('Creating departments...');
    const departments = await Department.create([
      { name: 'Marketing', description: 'Marketing and advertising department' },
      { name: 'SEO', description: 'Search Engine Optimization team' },
      { name: 'Development', description: 'Software development team' },
      { name: 'Design', description: 'UI/UX design team' },
      { name: 'Sales', description: 'Sales and business development' },
      { name: 'HR', description: 'Human Resources department' },
    ]);
    console.log('Departments created');

    // Create Users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    // Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@zenfix.com',
      password: hashedPassword,
      role: 'admin',
      department: 'Development',
      phone: '+1234567890',
    });

    // Managers
    const manager1 = await User.create({
      name: 'John Manager',
      email: 'john.manager@zenfix.com',
      password: hashedPassword,
      role: 'manager',
      department: 'Marketing',
      phone: '+1234567891',
    });

    const manager2 = await User.create({
      name: 'Sarah Manager',
      email: 'sarah.manager@zenfix.com',
      password: hashedPassword,
      role: 'manager',
      department: 'Development',
      phone: '+1234567892',
    });

    // Workers
    const workers = await User.create([
      {
        name: 'Mike Worker',
        email: 'mike.worker@zenfix.com',
        password: hashedPassword,
        role: 'worker',
        department: 'Marketing',
        phone: '+1234567893',
      },
      {
        name: 'Emily Worker',
        email: 'emily.worker@zenfix.com',
        password: hashedPassword,
        role: 'worker',
        department: 'SEO',
        phone: '+1234567894',
      },
      {
        name: 'David Worker',
        email: 'david.worker@zenfix.com',
        password: hashedPassword,
        role: 'worker',
        department: 'Development',
        phone: '+1234567895',
      },
      {
        name: 'Lisa Worker',
        email: 'lisa.worker@zenfix.com',
        password: hashedPassword,
        role: 'worker',
        department: 'Design',
        phone: '+1234567896',
      },
      {
        name: 'Tom Worker',
        email: 'tom.worker@zenfix.com',
        password: hashedPassword,
        role: 'worker',
        department: 'Sales',
        phone: '+1234567897',
      },
    ]);
    console.log('Users created');

    // Create Tasks
    console.log('Creating tasks...');
    const taskData = [
      {
        title: 'Website Redesign Project',
        description: 'Complete redesign of the company website with modern UI/UX principles and improved performance.',
        priority: 'high',
        status: 'in_progress',
        assignedBy: manager1._id,
        assignedTo: workers[0]._id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        estimatedHours: 40,
        department: 'Marketing',
        tags: ['urgent', 'design', 'frontend'],
        checklist: [
          { text: 'Create wireframes', completed: true },
          { text: 'Design mockups', completed: true },
          { text: 'Implement responsive design', completed: false },
          { text: 'Optimize images', completed: false },
          { text: 'Test across browsers', completed: false },
        ],
      },
      {
        title: 'SEO Campaign Optimization',
        description: 'Optimize existing SEO campaigns to improve organic search rankings and increase traffic.',
        priority: 'medium',
        status: 'pending',
        assignedBy: manager1._id,
        assignedTo: workers[1]._id,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        estimatedHours: 25,
        department: 'SEO',
        tags: ['seo', 'analytics', 'content'],
      },
      {
        title: 'Mobile App Development',
        description: 'Develop a cross-platform mobile application for customer engagement.',
        priority: 'critical',
        status: 'in_progress',
        assignedBy: manager2._id,
        assignedTo: workers[2]._id,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        estimatedHours: 120,
        department: 'Development',
        tags: ['mobile', 'react-native', 'backend'],
        checklist: [
          { text: 'Setup project structure', completed: true },
          { text: 'Design database schema', completed: true },
          { text: 'Build API endpoints', completed: false },
          { text: 'Implement authentication', completed: false },
          { text: 'Create UI components', completed: false },
        ],
      },
      {
        title: 'Brand Identity Design',
        description: 'Create a new brand identity including logo, color palette, and brand guidelines.',
        priority: 'high',
        status: 'completed',
        assignedBy: manager1._id,
        assignedTo: workers[3]._id,
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        estimatedHours: 30,
        department: 'Design',
        tags: ['branding', 'design', 'logo'],
        completionNotes: 'Brand identity completed successfully. All assets delivered.',
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Sales Dashboard',
        description: 'Build an interactive sales dashboard for tracking performance metrics.',
        priority: 'medium',
        status: 'pending',
        assignedBy: manager2._id,
        assignedTo: workers[4]._id,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        estimatedHours: 35,
        department: 'Sales',
        tags: ['dashboard', 'analytics', 'sales'],
      },
      {
        title: 'Content Marketing Strategy',
        description: 'Develop and implement a comprehensive content marketing strategy.',
        priority: 'low',
        status: 'pending',
        assignedBy: manager1._id,
        assignedTo: workers[0]._id,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        estimatedHours: 50,
        department: 'Marketing',
        tags: ['content', 'marketing', 'strategy'],
      },
      {
        title: 'Performance Audit',
        description: 'Conduct a comprehensive performance audit of all digital assets.',
        priority: 'medium',
        status: 'overdue',
        assignedBy: manager2._id,
        assignedTo: workers[2]._id,
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        estimatedHours: 20,
        department: 'Development',
        tags: ['performance', 'audit', 'optimization'],
      },
      {
        title: 'Social Media Campaign',
        description: 'Launch a social media campaign for new product promotion.',
        priority: 'high',
        status: 'in_progress',
        assignedBy: manager1._id,
        assignedTo: workers[0]._id,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        estimatedHours: 30,
        department: 'Marketing',
        tags: ['social-media', 'campaign', 'promotion'],
      },
    ];
    await Task.insertMany(taskData);
    console.log('Tasks created');

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin: admin@zenfix.com / Admin@123');
    console.log('   Manager: john.manager@zenfix.com / Admin@123');
    console.log('   Manager: sarah.manager@zenfix.com / Admin@123');
    console.log('   Worker: mike.worker@zenfix.com / Admin@123');
    console.log('   Worker: emily.worker@zenfix.com / Admin@123');
    console.log('   Worker: david.worker@zenfix.com / Admin@123');
    console.log('   Worker: lisa.worker@zenfix.com / Admin@123');
    console.log('   Worker: tom.worker@zenfix.com / Admin@123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
