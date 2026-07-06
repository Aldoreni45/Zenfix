'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker',
    department: '',
    phone: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }
    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      redirect('/adminzenfix/dashboard');
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('User creation response:', data, 'Status:', response.status);

      if (response.ok || response.status === 201) {
        toast.success('User created successfully');
        setTimeout(() => {
          redirect('/adminzenfix/users');
        }, 500);
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('User creation error:', error);
      toast.error('An error occurred while creating user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/adminzenfix/users">
          <Button variant="ghost" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Create New User</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-surface/50 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-surface/50 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="bg-surface/50 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-300">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-surface/50 border-white/10 text-white"
            >
              <option value="worker">Worker</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-gray-300">Department</Label>
            <select
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-surface/50 border-white/10 text-white"
            >
              <option value="">Select Department</option>
              <option value="Marketing">Marketing</option>
              <option value="SEO">SEO</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-surface/50 border-white/10 text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-electric-cyan to-purple"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
