'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, UserPlus, Shield, Mail, Phone, Building2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  avatar?: string;
  createdAt: string;
}

export default function ManagersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }
  }, [status]);

  useEffect(() => {
    const fetchManagers = async () => {
      if (status === 'authenticated') {
        setLoading(true);
        try {
          const url = searchQuery 
            ? `/api/users?role=manager&search=${searchQuery}`
            : '/api/users?role=manager';
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users || []);
          }
        } catch (error) {
          console.error('Error fetching managers:', error);
          toast.error('Failed to fetch managers');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchManagers();
  }, [status, searchQuery]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this manager?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Manager deleted successfully');
        setUsers(users.filter(user => user._id !== userId));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete manager');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Managers</h1>
          <p className="text-gray-400 mt-1">Manage your team managers</p>
        </div>
        {(session?.user as any)?.role === 'admin' && (
          <Link href="/adminzenfix/users/create">
            <Button className="bg-gradient-to-r from-electric-cyan to-purple">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Manager
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search managers by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-surface/50 border-white/10 text-white"
        />
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No managers found</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="glass-card rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {user.name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {user.department}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Manager
                  </span>
                  {(session?.user as any)?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
