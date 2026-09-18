'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useIsOwner } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';

const DEPARTMENTS = ['Marketing', 'SEO', 'Development', 'Design', 'Sales', 'HR', 'Production', 'Social Media'];

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Team Manager' },
  { value: 'owner', label: 'Owner' },
];

export default function CreateUserPage() {
  const router = useRouter();
  const { user, initialized, isAuthenticated } = useAuth();
  const isOwner = useIsOwner();

  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'employee',
    department: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect in an effect so we never call the router during render.
  useEffect(() => {
    if (initialized && (!isAuthenticated || !isOwner)) {
      router.replace('/adminzenfix/dashboard');
    }
  }, [initialized, isAuthenticated, isOwner, router]);

  if (!initialized || !isAuthenticated || !isOwner) {
    return null;
  }

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    if (!form.username.trim()) {
      setFieldErrors({ username: 'Username is required' });
      setSubmitting(false);
      return;
    }
    if (form.password.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters' });
      setSubmitting(false);
      return;
    }
    if (form.password !== form.confirm_password) {
      setFieldErrors({ confirm_password: 'Passwords do not match' });
      setSubmitting(false);
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      password: form.password,
      confirm_password: form.confirm_password,
      role: form.role,
      department: form.department,
      status: 'active',
    };

    const res = await api.post(apiEndpoints.users, payload);

    if (res.error) {
      if (res.status && res.status >= 400 && res.status < 500 && res.error.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(res.error);
          const errs: Record<string, string> = {};
          for (const [key, value] of Object.entries(parsed)) {
            const msgs = Array.isArray(value) ? value : [value];
            errs[key] = String(msgs[0] ?? 'Invalid value');
          }
          setFieldErrors(errs);
        } catch {
          toast.error(extractApiErrorMessage(res));
        }
      } else {
        toast.error(extractApiErrorMessage(res));
      }
    } else {
      toast.success('User created successfully');
      router.push('/adminzenfix/users');
      router.refresh();
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Create New User</h1>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username <span className="text-red-400">*</span></Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setField('username', e.target.value)}
                required
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
              {fieldErrors.username && <p className="text-red-400 text-xs">{fieldErrors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
              {fieldErrors.email && <p className="text-red-400 text-xs">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-gray-300">First Name</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => setField('first_name', e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-gray-300">Last Name</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => setField('last_name', e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password <span className="text-red-400">*</span></Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                required
                className="bg-slate-800/50 border-white/10 text-white"
              />
              {fieldErrors.password && <p className="text-red-400 text-xs">{fieldErrors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-gray-300">Confirm Password <span className="text-red-400">*</span></Label>
              <Input
                id="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={(e) => setField('confirm_password', e.target.value)}
                required
                className="bg-slate-800/50 border-white/10 text-white"
              />
              {fieldErrors.confirm_password && <p className="text-red-400 text-xs">{fieldErrors.confirm_password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">Role</Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
                className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-slate-900">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-gray-300">Department</Label>
              <select
                id="department"
                value={form.department}
                onChange={(e) => setField('department', e.target.value)}
                className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="" className="bg-slate-900">Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}