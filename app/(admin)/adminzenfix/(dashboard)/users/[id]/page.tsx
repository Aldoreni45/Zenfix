'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  Loader2,
  Ban,
  CheckCircle,
  Edit,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useIsOwner, useDepartments } from '@/lib/hooks';
import { isValidPhone, restrictPhoneInput, PHONE_ERROR } from '@/lib/validation';

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  manager: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  employee: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  inactive: 'bg-slate-500/10 text-slate-400',
  suspended: 'bg-red-500/10 text-red-400',
};

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default function UserDetailPage() {
  const params = useParams();
  const userId = String(params.id);
  const { user: currentUser } = useAuth();
  const isOwner = useIsOwner();
  const { data: departments } = useDepartments();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    role: '',
    department_id: null as number | null,
  });

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<any>(apiEndpoints.user(Number(userId)));
    if (res.error) {
      setError(extractApiErrorMessage(res));
    } else if (res.data) {
      setUserData(res.data);
      setEditForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        username: res.data.username || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        role: res.data.role || '',
        department_id: res.data.department_id || null,
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleToggleStatus = async () => {
    if (!isOwner || !userData) return;

    setUpdatingStatus(true);
    try {
      const newStatus = userData.status === 'active' ? 'inactive' : 'active';
      const res = await api.patch(`${apiEndpoints.user(Number(userId))}/status`, { status: newStatus });

      if (res.error) {
        toast.error(extractApiErrorMessage(res));
      } else {
        toast.success(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`);
        await fetchUser();
      }
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !userData) return;

    const username = editForm.username.trim();
    const email = editForm.email.trim();

    if (!username) {
      toast.error('Username is required');
      return;
    }
    if (!email) {
      toast.error('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (editForm.phone.trim() && !isValidPhone(editForm.phone)) {
      toast.error(PHONE_ERROR);
      return;
    }

    const payload: Record<string, any> = {};
    if (editForm.first_name.trim() !== (userData.first_name || '')) payload.first_name = editForm.first_name.trim();
    if (editForm.last_name.trim() !== (userData.last_name || '')) payload.last_name = editForm.last_name.trim();
    if (username !== userData.username) payload.username = username;
    if (email !== (userData.email || '')) payload.email = email;
    if (editForm.phone !== (userData.phone || '')) payload.phone = editForm.phone.trim();
    if (editForm.role !== userData.role) payload.role = editForm.role;

    // The API resolves departments by NAME, not by id.
    if ((editForm.department_id ?? null) !== (userData.department_id ?? null)) {
      if (editForm.department_id) {
        const dept = (departments || []).find((d: any) => d.id === editForm.department_id);
        if (!dept) {
          toast.error('Selected department could not be found. Please reselect it.');
          return;
        }
        payload.department = dept.name;
      } else {
        payload.department = null;
      }
    }

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    const res = await api.patch(apiEndpoints.user(Number(userId)), payload);
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success('User updated successfully');
      setEditing(false);
      await fetchUser();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400 text-center max-w-sm">{error || 'User not found'}</p>
        <Button onClick={fetchUser} className="bg-cyan-500 hover:bg-cyan-600">
          Retry
        </Button>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === userData.id;
  const canEdit = isOwner && !isCurrentUser && userData.role !== 'owner';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/adminzenfix/users">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {(userData.full_name || userData.username || 'U')[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{userData.full_name || userData.username || 'Unnamed'}</h1>
              <p className="text-slate-400">{userData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize border', ROLE_COLORS[userData.role] || 'bg-slate-500/10 text-slate-400')}>
                  {userData.role_name || userData.role}
                </span>
                {userData.role === 'owner' && (
                  <Crown className="h-4 w-4 text-purple-400" />
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Edit className="h-4 w-4 mr-2" />
                {editing ? 'Cancel' : 'Edit'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={updatingStatus}
                className={cn(
                  userData.status === 'active' ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                )}
              >
                {updatingStatus ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : userData.status === 'active' ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Block
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4 border-t border-white/10 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-slate-300">First Name</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="bg-slate-800/50 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-slate-300">Last Name</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="bg-slate-800/50 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username <span className="text-red-400">*</span></Label>
                <Input
                  id="username"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="bg-slate-800/50 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email <span className="text-red-400">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-slate-800/50 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: restrictPhoneInput(e.target.value) })}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit number"
                  className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">Role</Label>
                <select
                  id="role"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  disabled={userData.role === 'owner'}
                  className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  {userData.role === 'owner' && <option value="owner">Owner</option>}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-slate-300">Department</Label>
                <select
                  id="department"
                  value={editForm.department_id ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">No department</option>
                  {(departments || []).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600">
                Save Changes
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setEditing(false); fetchUser(); }} className="text-slate-400">
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Username</p>
                <p className="text-white text-sm font-medium">{userData.username || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="text-white text-sm font-medium">{userData.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                <p className="text-white text-sm font-medium">{userData.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Department</p>
                <p className="text-white text-sm font-medium">{userData.department_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Status</p>
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_COLORS[userData.status] || 'bg-slate-500/10 text-slate-400')}>
                  {userData.status}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Last Login</p>
                <p className="text-white text-sm font-medium">
                  {userData.last_login ? new Date(userData.last_login).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Created At</p>
                <p className="text-white text-sm font-medium">
                  {userData.created_at ? new Date(userData.created_at).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
