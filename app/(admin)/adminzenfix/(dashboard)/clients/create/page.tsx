'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Building2,
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Phone,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useIsOwner, useIsManager } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';


export default function CreateClientPage() {
  const router = useRouter();
  const { user, initialized, isAuthenticated } = useAuth();
  const isOwner = useIsOwner();
  const isManager = useIsManager();
  const canManage = isOwner || isManager;


  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    monthly_video_target: '5',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect unauthorized users after initialization
  useEffect(() => {
    if (initialized && (!isAuthenticated || !canManage)) {
      router.replace('/adminzenfix/clients');
    }
  }, [initialized, isAuthenticated, canManage, router]);

  if (!initialized || !isAuthenticated || !canManage) {
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

    if (!form.name.trim()) {
      setFieldErrors({ name: 'Client name is required' });
      toast.error('Please provide a client name');
      setSubmitting(false);
      return;
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      toast.error('Invalid email address');
      setSubmitting(false);
      return;
    }

    const payload: Record<string, any> = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      monthly_video_target: Number(form.monthly_video_target) || 5,
      assigned_team: [], // Required by serializer, send empty array if no team assigned
    };

    console.log('[CREATE CLIENT] Sending payload:', JSON.stringify(payload, null, 2));
    const res = await api.post(apiEndpoints.clients, payload);
    console.log('[CREATE CLIENT] Response status:', res.status);
    console.log('[CREATE CLIENT] Response error:', res.error);
    console.log('[CREATE CLIENT] Response data:', res.data);

    if (res.error) {
      const status = res.status;
      if (status && status >= 400 && status < 500 && res.error.trim().startsWith('{')) {
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
      toast.success('Client created successfully!');
      router.push('/adminzenfix/clients');
      router.refresh();
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header & Back Link */}
      <div className="flex flex-col gap-2">
        <Link
          href="/adminzenfix/clients"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400">
                <Building2 className="h-6 w-6" />
              </span>
              Add New Client
            </h1>
            <p className="text-slate-400 mt-1">
              Create a client account to manage projects, video targets, and assigned team members.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-400" />
              Client Information
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Basic client details and contact information</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Brand Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Acme Lifestyle"
                className={cn(
                  'bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500',
                  fieldErrors.name && 'border-red-500/80 focus-visible:ring-red-500'
                )}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Brand Owner */}
            <div className="space-y-2">
              <Label htmlFor="contact_person" className="text-slate-200">
                Brand Owner
              </Label>
              <Input
                id="contact_person"
                value={form.contact_person}
                onChange={(e) => setField('contact_person', e.target.value)}
                placeholder="e.g. Jane Doe"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="contact@acme.com"
                className={cn(
                  'bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500',
                  fieldErrors.email && 'border-red-500/80 focus-visible:ring-red-500'
                )}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-200 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Monthly Target */}
            <div className="space-y-2">
              <Label htmlFor="monthly_video_target" className="text-slate-200 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-slate-400" />
                Monthly Target
              </Label>
              <Input
                id="monthly_video_target"
                type="number"
                min={1}
                max={100}
                value={form.monthly_video_target}
                onChange={(e) => setField('monthly_video_target', e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white"
              />
              <p className="text-xs text-slate-500">Videos per month</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/adminzenfix/clients">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium px-6 shadow-lg shadow-cyan-500/20"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Client...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Client
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
