'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Phone, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/lib/hooks';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { changePassword } from '@/lib/actions/auth';

export default function ProfilePage() {
  const { user, refetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  const displayName = user.full_name || user.username || 'User';

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const res = await api.patch(apiEndpoints.user(user.id), {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
    });

    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success('Profile updated successfully');
      refetch();
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);

    const formDataObj = new FormData();
    formDataObj.append('currentPassword', passwordData.currentPassword);
    formDataObj.append('newPassword', passwordData.newPassword);
    formDataObj.append('confirmPassword', passwordData.confirmPassword);

    const result = await changePassword(formDataObj);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    setPasswordLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
            {displayName[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{displayName}</h2>
            <p className="text-gray-400 capitalize flex items-center gap-1">
              <Shield className="h-4 w-4" />
              {user.role_name || user.role}
            </p>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            {user.department_name && (
              <p className="text-sm text-gray-500 mt-1">Department: {user.department_name}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name
              </Label>
              <Input
                id="firstName"
                onChange={(e) => setFormData((f) => ({ ...f, first_name: e.target.value }))}
                value={formData.first_name}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                Last Name
              </Label>
              <Input
                id="lastName"
                onChange={(e) => setFormData((f) => ({ ...f, last_name: e.target.value }))}
                value={formData.last_name}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-slate-800/50 border-white/10 text-white opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                value={formData.phone}
                className="bg-slate-800/50 border-white/10 text-white"
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Password Change Card */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
              className="bg-slate-800/50 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              className="bg-slate-800/50 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
              className="bg-slate-800/50 border-white/10 text-white"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}