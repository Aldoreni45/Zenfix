'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, UserPlus, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { api, apiEndpoints, extractApiErrorMessage, type ApiResponse } from '@/lib/api';
import { useIsOwner } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Team Manager' },
];

// Mirrors validatePasswordStrength on the server so the user gets instant
// feedback instead of a silent rejection.
function getPasswordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) issues.push('one uppercase letter');
  if (!/[a-z]/.test(password)) issues.push('one lowercase letter');
  if (!/[0-9]/.test(password)) issues.push('one number');
  return issues;
}

// Turn a raw error response into field errors and/or a general message.
function parseApiErrors(
  res: ApiResponse<unknown>
): { fieldErrors: Record<string, string>; message: string | null } {
  const raw = res.error ?? '';
  try {
    const parsed = JSON.parse(raw);
    let payload: any = parsed;
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      payload = (parsed as any).error;
    }

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const fieldErrors: Record<string, string> = {};
      const knownFields = new Set([
        'username', 'email', 'phone', 'password', 'confirm_password', 'role',
      ]);
      let hasField = false;
      for (const [key, value] of Object.entries(payload)) {
        if (!knownFields.has(key)) continue;
        const msg = Array.isArray(value) ? String(value[0]) : String(value);
        fieldErrors[key] = msg;
        hasField = true;
      }
      if (hasField) return { fieldErrors, message: null };
    }

    if (typeof payload === 'string' && payload.trim()) {
      return { fieldErrors: {}, message: payload };
    }
  } catch {
    // Not JSON — fall through to the generic extractor.
  }

  return { fieldErrors: {}, message: extractApiErrorMessage(res) };
}

export default function CreateUserPage() {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAuth();
  const isOwner = useIsOwner();

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    // Client-side validation — every field is required.
    const errs: Record<string, string> = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.role) errs.role = 'Role is required';
    if (!form.password) {
      errs.password = 'Password is required';
    } else {
      const issues = getPasswordIssues(form.password);
      if (issues.length > 0) {
        errs.password = `Password must contain ${issues.join(', ')}`;
      }
    }
    if (!form.confirm_password) {
      errs.confirm_password = 'Please confirm the password';
    } else if (form.password !== form.confirm_password) {
      errs.confirm_password = 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setSubmitting(false);
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      confirm_password: form.confirm_password,
      role: form.role,
      status: 'active',
    };

    const res = await api.post(apiEndpoints.users, payload);

    if (res.error) {
      const { fieldErrors: parsedFields, message } = parseApiErrors(res);
      if (Object.keys(parsedFields).length > 0) {
        setFieldErrors(parsedFields);
        toast.error('Please fix the highlighted fields');
      } else {
        const msg = message || 'Failed to create user';
        setGeneralError(msg);
        toast.error(msg);
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

        {generalError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username <span className="text-red-400">*</span></Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setField('username', e.target.value)}
                required
                autoComplete="off"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
              {fieldErrors.username && <p className="text-red-400 text-xs">{fieldErrors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email <span className="text-red-400">*</span></Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                required
                autoComplete="off"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
              {fieldErrors.email && <p className="text-red-400 text-xs">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone <span className="text-red-400">*</span></Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                required
                autoComplete="off"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
              {fieldErrors.phone && <p className="text-red-400 text-xs">{fieldErrors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">Role <span className="text-red-400">*</span></Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
                required
                className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="" className="bg-slate-900">Select Role</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-slate-900">
                    {r.label}
                  </option>
                ))}
              </select>
              {fieldErrors.role && <p className="text-red-400 text-xs">{fieldErrors.role}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-slate-800/50 border-white/10 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs">{fieldErrors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-gray-300">Confirm Password <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => setField('confirm_password', e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-slate-800/50 border-white/10 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirm_password && <p className="text-red-400 text-xs">{fieldErrors.confirm_password}</p>}
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
