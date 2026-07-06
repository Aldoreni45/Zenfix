'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar,
  KanbanSquare,
  Users, 
  BarChart3, 
  TrendingUp,
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Role-based navigation
const workerNavigation = [
  { name: 'Dashboard', href: '/adminzenfix/dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', href: '/adminzenfix/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/adminzenfix/calendar', icon: Calendar },
  { name: 'Notifications', href: '/adminzenfix/notifications', icon: Bell },
  { name: 'Profile', href: '/adminzenfix/profile', icon: User },
];

const managerNavigation = [
  { name: 'Dashboard', href: '/adminzenfix/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/adminzenfix/tasks', icon: CheckSquare },
  { name: 'Create Task', href: '/adminzenfix/tasks/create', icon: KanbanSquare },
  { name: 'Calendar', href: '/adminzenfix/calendar', icon: Calendar },
  { name: 'Reports', href: '/adminzenfix/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/adminzenfix/notifications', icon: Bell },
  { name: 'Profile', href: '/adminzenfix/profile', icon: User },
];

const adminNavigation = [
  { name: 'Dashboard', href: '/adminzenfix/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/adminzenfix/users', icon: Users },
  { name: 'Managers', href: '/adminzenfix/users/managers', icon: Users },
  { name: 'Workers', href: '/adminzenfix/users/workers', icon: Users },
  { name: 'Tasks', href: '/adminzenfix/tasks', icon: CheckSquare },
  { name: 'Reports', href: '/adminzenfix/reports', icon: BarChart3 },
  { name: 'Analytics', href: '/adminzenfix/analytics', icon: TrendingUp },
  { name: 'Activity Logs', href: '/adminzenfix/activity-logs', icon: Bell },
  { name: 'Settings', href: '/adminzenfix/settings', icon: Settings },
  { name: 'Notifications', href: '/adminzenfix/notifications', icon: Bell },
  { name: 'Profile', href: '/adminzenfix/profile', icon: User },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userRole = (session?.user as any)?.role || 'worker';

  const navigation = userRole === 'admin' 
    ? adminNavigation 
    : userRole === 'manager' 
    ? managerNavigation 
    : workerNavigation;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/adminzenfix/login' });
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
            <Link href="/adminzenfix/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">ZenFix</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-cyan-400' : 'group-hover:text-white')} />
                  <span className="relative">
                    {item.name}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {(session?.user as any)?.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {(session?.user as any)?.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 capitalize">{userRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 rounded-xl transition-all duration-200 border border-transparent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl w-96">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks, users, reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
              </button>

              {/* Profile dropdown */}
              <button className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                  {(session?.user as any)?.name?.[0] || 'U'}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SessionProvider>
  );
}
