# ZenFix Admin Portal

A production-ready enterprise admin portal for the ZenFix Digital Marketing Agency, built with a Next.js (App Router) frontend and a Django REST Framework backend.

## Features

- **Role-Based Access Control (RBAC)**
  - Owner: Full system access, user management, system overview, audit logs, analytics/reports
  - Manager: Create and assign tasks, manage team, approve/reject completions, view reports
  - Employee: View assigned tasks, update status, notifications, profile

- **Task Management**
  - Create, bulk-create, assign, and track tasks
  - Priority levels (Low, Medium, High, Urgent)
  - Status tracking (Pending, Assigned, In Progress, Completed, Overdue, Cancelled, Waiting Approval, Rejected)
  - Carry-forward pending tasks to a new due date (single or all at once)
  - Upcoming-deadline calendar and activity/status history
  - Automatic overdue detection

- **Authentication & Security**
  - Django session authentication with CSRF protection
  - Login rate limiting and failed attempt lockout
  - Request throttling on login and sensitive endpoints
  - DRF permission classes for role-based access on every endpoint

- **Dashboard / Analytics**
  - Role-specific dashboards
  - Task statistics, activity logs, notification center
  - Analytics and trend charts, reports with CSV/print export
  - Owner-only system overview (settings page)

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI, Radix UI
- **Charts**: Recharts
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Backend**: Django 5.2 + Django REST Framework
- **Auth**: Django session authentication + CSRF (NOT JWT)
- **Database**: MongoDB Atlas via django-mongodb-backend (PRIMARY database - never SQLite)

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd zenfix
```

2. Install frontend dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

The Django backend reads its configuration from `backend/.env`:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/
MONGODB_DB=zenfix
DJANGO_SECRET_KEY=<generate-a-strong-random-key>
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

4. Set up the backend (Python 3.11+)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
python -m pip install -r requirements.txt
```

5. Run migrations and seed data

```bash
python manage.py migrate
python manage.py seed_users
```

The seed command creates:
- 1 Owner user
- 1 Manager user
- 1 Employee user
- 8 Departments

**Default login credentials**:
- Owner: `admin` / `admin123`
- Manager: `manager` / `manager123`
- Employee: `employee` / `employee123`

6. Run the servers

Backend (port 8000):

```bash
cd backend
python manage.py runserver
```

Frontend (port 3000):

```bash
npm run dev
```

7. Access the admin portal

- Public website: `http://localhost:3000`
- Admin portal: `http://localhost:3000/adminzenfix`
- Django admin: `http://localhost:8000/admin/`

## Project Structure

```
zenfix/
├── app/
│   ├── (admin)/adminzenfix/   # Admin portal routes
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # Dashboard pages
│   │   │   ├── dashboard/     # Role-based dashboard
│   │   │   ├── tasks/         # Task list, create, [id], bulk, carry-forward
│   │   │   ├── users/         # User management (Owner/Manager)
│   │   │   │   ├── managers/  # Manager directory
│   │   │   │   └── workers/   # Employee directory
│   │   │   ├── activity-logs/ # Audit log viewer
│   │   │   ├── notifications/ # Notification center
│   │   │   ├── analytics/     # Trend/team analytics
│   │   │   ├── reports/       # Reports + CSV/print export
│   │   │   ├── calendar/      # Task calendar (month/week/day)
│   │   │   ├── profile/       # Profile + password change
│   │   │   └── settings/      # Owner system overview
│   │   └── layout.tsx         # Admin layout with sidebar guard
│   └── page.tsx               # Public landing page
├── components/ui/             # Shadcn UI components
├── lib/
│   ├── api.ts                 # API client (JWT + auto-refresh) and endpoints
│   ├── hooks.ts               # useApi/useAuth/useTasks/useUsers/etc.
│   ├── actions/auth.ts        # Server-less auth helpers (login/logout/change password)
│   └── auth-context.tsx       # Auth provider
└── backend/
    ├── users/                 # User, department + auth endpoints
    ├── clients/               # Clients + monthly targets
    ├── videos/                # Video workflow + assets
    ├── tasks/                 # Tasks + carry-forward/bulk actions
    ├── approvals/             # Approvals + social posts
    ├── activity_logs/         # Activity logs + notifications
    ├── dashboard/             # Role dashboard + company overview
    ├── services.py            # Business-logic services
    └── zenfix_project/        # Settings, root URLs
```

## API Endpoints

Base URL: `http://127.0.0.1:8000/api`

### Auth
- `GET /auth/csrf/` - Get CSRF token
- `POST /auth/login/` - Login (username + password) -> `{user, access: "session", refresh: "session"}`
- `POST /auth/logout/` - Logout (terminates session)
- `GET /auth/me/` - Get current user
- `POST /auth/password-change/` - Change password
- `POST /auth/password-reset/` - Request password reset
- `POST /auth/password-reset-confirm/` - Confirm password reset

### Users (`IsAuthenticated`; mutations gated by role)
- `GET/POST /users/`
- `GET/PATCH/DELETE /users/{id}/`
- `GET /users/me/` - Current profile
- `GET /users/managers/` - Active managers
- `GET /users/employees/` - Active employees
- `POST /users/{id}/update_role/` - Change role (Owner)
- `POST /users/change_password/` - Change password (requires `old_password`)

### Tasks
- `GET/POST /tasks/` (filter/search/order via query params)
- `GET/PATCH/DELETE /tasks/{id}/`
- `POST /tasks/bulk_create/` - `{tasks: [...]}`
- `POST /tasks/carry_forward_all_pending/` - `{new_due_date}`
- `POST /tasks/{id}/carry_forward/` - `{new_due_date}`
- `POST /tasks/{id}/start/`, `/complete/`, `/reject/`, `/assign/`
- `GET /tasks/my_tasks/`, `pending/`, `overdue/`, `today/`, `upcoming/?days=N`, `pending_previous/`

### Clients / Videos / Approvals
- `GET/POST /clients/`, `/monthly-targets/`
- `GET/POST /videos/`, `/video-assets/`
- `GET/POST /approvals/`, `/social-posts/`

### Activity Logs & Notifications
- `GET /activity-logs/` (paginated; `search`, `action`, `page`)
- `GET/POST /notifications/`
- `POST /notifications/{id}/mark_read/`
- `POST /notifications/mark_all_read/`
- `GET /notifications/unread/`, `urgent/`, `count/`

### Dashboard
- `GET /dashboard/` - Role-scoped dashboard data
- `GET /dashboard/company-overview/` - Owner-only system overview

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Set `NEXT_PUBLIC_API_URL` to the deployed backend (e.g. `https://api.your-domain.com/api`)
4. Deploy

### Backend (any Django host, e.g. Heroku/Railway/a VPS)

Set `backend/.env` with `DEBUG=False` in production:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/
MONGODB_DB=zenfix
DJANGO_SECRET_KEY=<generate-a-strong-random-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## Security Considerations

- All admin routes are protected by an auth guard in the admin layout
- Passwords hashed by Django's PBKDF2 (configurable via `PASSWORD_HASHERS`)
- Session-based authentication with CSRF protection and secure cookies in production
- DRF permission classes + per-endpoint role checks on every viewset
- Request throttling: login (8/min), password reset (5/hour), user (1000/hour), anon (60/hour)
- DRF renders JSON only in production; security headers + HSTS enabled when `DEBUG=False`
- Validation errors are unwrapped client-side; backend responses never leak exception details
- MongoDB credentials are environment variables only - never committed