'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createTask } from '@/lib/actions/task';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    deadline: '',
    estimatedHours: '',
    department: '',
    tags: '',
  });

  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }

    if (status === 'authenticated') {
      const userRole = (session.user as any)?.role;
      if (!['manager', 'admin'].includes(userRole)) {
        redirect('/adminzenfix/dashboard');
      }
    }
  }, [status, session]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (status === 'authenticated') {
        setLoadingUsers(true);
        try {
          const params = new URLSearchParams();
          params.append('role', 'worker');
          if (selectedDepartment) {
            params.append('department', selectedDepartment);
          }
          
          const response = await fetch(`/api/users?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users || []);
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to fetch users');
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          toast.error('Failed to fetch users');
        } finally {
          setLoadingUsers(false);
        }
      }
    };

    fetchUsers();
  }, [status, selectedDepartment]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Task description is required');
      setLoading(false);
      return;
    }

    if (!formData.assignedTo) {
      toast.error('Please assign the task to a user');
      setLoading(false);
      return;
    }

    if (!formData.deadline) {
      toast.error('Deadline is required');
      setLoading(false);
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate < new Date()) {
      toast.error('Deadline cannot be in the past');
      setLoading(false);
      return;
    }

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });

      const result = await createTask(formDataObj);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Task created and assigned successfully');
        router.push('/adminzenfix/tasks');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/adminzenfix/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Task</h1>
          <p className="text-gray-400 mt-1">Assign a new task to your team</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-300">Task Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
            required
            className="bg-surface/50 border-white/10 text-white"
            placeholder="Enter task title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-gray-300">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-surface/50 border-white/10 text-white"
            placeholder="Describe the task in detail"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-gray-300">Priority</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, priority: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-surface/50 border-white/10 text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-gray-300">Department</Label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setSelectedDepartment(e.target.value);
                setFormData({ ...formData, department: e.target.value });
              }}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedTo" className="text-gray-300">Assign To</Label>
          <select
            id="assignedTo"
            value={formData.assignedTo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, assignedTo: e.target.value })}
            required
            disabled={loadingUsers}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-surface/50 border-white/10 text-white"
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email}) - {user.role}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-gray-300">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, deadline: e.target.value })}
              required
              className="bg-surface/50 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedHours" className="text-gray-300">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              value={formData.estimatedHours}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, estimatedHours: e.target.value })}
              className="bg-surface/50 border-white/10 text-white"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags" className="text-gray-300">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tags: e.target.value })}
            className="bg-surface/50 border-white/10 text-white"
            placeholder="e.g., urgent, frontend, backend"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-electric-cyan to-purple"
            disabled={loading || loadingUsers}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </Button>
          <Link href="/adminzenfix/tasks" className="flex-1">
            <Button type="button" variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
