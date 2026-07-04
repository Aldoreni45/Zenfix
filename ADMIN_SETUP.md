# ZenFix Admin Portal

A production-ready enterprise admin portal for the ZenFix Digital Marketing Agency.

## Features

- **Role-Based Access Control (RBAC)**
  - Worker: View assigned tasks, update status, add comments
  - Manager: Create tasks, assign tasks, approve/reject completions, view reports
  - Admin: Full system access, user management, settings, audit logs

- **Task Management**
  - Create, assign, and track tasks
  - Priority levels (Low, Medium, High, Critical)
  - Task status tracking (Pending, In Progress, Completed, Rejected, Overdue)
  - Deadline management with automatic overdue detection
  - Comments and activity timeline
  - Checklist support
  - File attachments

- **Authentication & Security**
  - NextAuth.js with credentials provider
  - JWT session management
  - bcrypt password hashing
  - Protected routes with middleware
  - Role-based route protection

- **Dashboard**
  - Role-specific dashboards
  - Task statistics
  - Recent activities
  - Upcoming deadlines
  - Performance metrics

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI, Radix UI
- **Database**: MongoDB Atlas
- **ORM**: Mongoose
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Validation**: Zod
- **Forms**: React Hook Form
- **Notifications**: Sonner
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd zenfix
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/zenfix?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

4. Run the seed script to populate initial data

```bash
npx tsx scripts/seed.ts
```

This will create:
- 1 Admin user
- 2 Manager users
- 5 Worker users
- 6 Departments
- 8 Sample tasks

**Default login credentials** (all users use the same password):
- Email: `admin@zenfix.com` / Password: `Admin@123`
- Email: `john.manager@zenfix.com` / Password: `Admin@123`
- Email: `sarah.manager@zenfix.com` / Password: `Admin@123`
- Email: `mike.worker@zenfix.com` / Password: `Admin@123`
- Email: `emily.worker@zenfix.com` / Password: `Admin@123`
- Email: `david.worker@zenfix.com` / Password: `Admin@123`
- Email: `lisa.worker@zenfix.com` / Password: `Admin@123`
- Email: `tom.worker@zenfix.com` / Password: `Admin@123`

5. Run the development server

```bash
npm run dev
```

6. Access the admin portal

Open your browser and navigate to:
- Public website: `http://localhost:3000`
- Admin portal: `http://localhost:3000/adminzenfix`

## Project Structure

```
zenfix/
├── app/
│   ├── adminzenfix/          # Admin portal routes
│   │   ├── (auth)/          # Authentication pages
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── tasks/           # Task management
│   │   ├── users/           # User management (Admin only)
│   │   ├── reports/         # Reports (Manager/Admin)
│   │   ├── profile/         # User profile
│   │   ├── settings/        # Settings (Admin only)
│   │   ├── layout.tsx       # Admin layout with sidebar
│   │   └── page.tsx         # Login page
│   ├── api/                 # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── tasks/           # Task API
│   │   ├── users/           # User API
│   │   └── dashboard/       # Dashboard stats
│   └── page.tsx             # Public landing page
├── components/
│   ├── ui/                  # Shadcn UI components
│   └── ...                  # Other components
├── lib/
│   ├── actions/             # Server actions
│   ├── schemas/             # Zod validation schemas
│   ├── auth.ts              # NextAuth configuration
│   ├── mongodb.ts           # MongoDB connection
│   └── utils.ts             # Utility functions
├── models/                  # Mongoose models
│   ├── User.ts
│   ├── Task.ts
│   ├── Comment.ts
│   ├── Notification.ts
│   ├── ActivityLog.ts
│   └── Department.ts
├── scripts/
│   └── seed.ts              # Database seeding script
├── middleware.ts            # Route protection middleware
└── package.json
```

## Role Permissions

### Worker
- ✅ View assigned tasks
- ✅ Start tasks
- ✅ Complete tasks
- ✅ Mark tasks as not completed
- ✅ Add comments
- ✅ View profile
- ❌ Create tasks
- ❌ Assign tasks
- ❌ View reports
- ❌ Manage users

### Manager
- ✅ Everything Worker can do
- ✅ Create tasks
- ✅ Assign tasks
- ✅ Edit tasks
- ✅ Approve completed tasks
- ✅ Reject completed tasks
- ✅ View team tasks
- ✅ View reports
- ❌ Delete users
- ❌ Manage admin accounts

### Admin
- ✅ Full system access
- ✅ User management
- ✅ Task management
- ✅ Reports and analytics
- ✅ System settings
- ✅ Audit logs
- ✅ Role management

## API Routes

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/[id]` - Get task by ID
- `POST /api/tasks` - Create task (Manager/Admin)
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task (Admin)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Database Models

### User
- name, email, password, phone
- role (worker/manager/admin)
- department
- avatar, status
- lastLogin, timestamps

### Task
- title, description, priority
- status (pending/in_progress/completed/rejected/not_completed/overdue/cancelled)
- assignedBy, assignedTo
- deadline, estimatedHours
- completionNotes, notCompletedReason
- attachments, checklist, tags
- completedAt, timestamps

### Comment
- taskId, userId
- message, attachments
- timestamps

### Notification
- receiver, title, message
- type, read status
- link, timestamp

### ActivityLog
- user, action, entity
- entityId, details
- ipAddress, userAgent
- timestamp

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/zenfix?retryWrites=true&w=majority
NEXTAUTH_SECRET=<generate-a-strong-secret>
NEXTAUTH_URL=https://your-domain.com
```

## Security Considerations

- All admin routes are protected by middleware
- Passwords are hashed with bcrypt (12 rounds)
- JWT sessions with secure cookies
- Role-based access control on all operations
- Input validation with Zod
- SQL injection prevention (MongoDB)
- XSS protection (React's built-in escaping)

## Development

### Adding New Features

1. Create Mongoose model in `models/`
2. Create Zod schema in `lib/schemas/`
3. Create server action in `lib/actions/`
4. Create API route in `app/api/`
5. Create UI components in `components/`
6. Create page in `app/adminzenfix/`

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## Support

For issues and questions, please contact the development team.

## License

Copyright © 2024 ZenFix Digital Marketing Agency. All rights reserved.
