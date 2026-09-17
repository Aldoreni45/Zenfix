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
  Globe,
  Instagram,
  MapPin,
  Calendar,
  UserCheck,
  Briefcase,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useManagers, useIsOwner, useIsManager } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'text-green-400' },
  { value: 'lead', label: 'Lead', color: 'text-cyan-400' },
  { value: 'paused', label: 'Paused', color: 'text-yellow-400' },
  { value: 'completed', label: 'Completed', color: 'text-blue-400' },
  { value: 'inactive', label: 'Inactive', color: 'text-slate-400' },
  { value: 'archived', label: 'Archived', color: 'text-slate-500' },
];

const COMMON_INDUSTRIES = [
  'E-Commerce',
  'Health & Fitness',
  'Real Estate',
  'Technology & SaaS',
  'Fashion & Apparel',
  'Hospitality & Food',
  'Education',
  'Digital Marketing',
];

export default function CreateClientPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isOwner = useIsOwner();
  const isManager = useIsManager();
  const canManage = isOwner || isManager;

  const { data: managers, loading: managersLoading } = useManagers();

  const [form, setForm] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    description: '',
    address: '',
    instagram_username: '',
    instagram_url: '',
    status: 'active',
    assigned_manager: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect unauthorized users
  useEffect(() => {
    if (!authLoading && (!user || !canManage)) {
      router.replace('/adminzenfix/clients');
    }
  }, [authLoading, user, canManage, router]);

  if (authLoading || !user || !canManage) {
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

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
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
      company_name: form.company_name.trim(),
      contact_person: form.contact_person.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      industry: form.industry.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      instagram_username: form.instagram_username.trim().replace(/^@+/, ''),
      status: form.status,
      notes: form.notes.trim(),
    };

    if (form.website.trim()) {
      payload.website = normalizeUrl(form.website);
    }
    if (form.instagram_url.trim()) {
      payload.instagram_url = normalizeUrl(form.instagram_url);
    } else if (form.instagram_username.trim()) {
      const cleanHandle = form.instagram_username.trim().replace(/^@+/, '');
      payload.instagram_url = `https://instagram.com/${cleanHandle}`;
    }

    if (form.assigned_manager) {
      payload.assigned_manager = Number(form.assigned_manager);
    } else if (user.role === 'manager') {
      payload.assigned_manager = user.id;
    }

    if (form.start_date) payload.start_date = form.start_date;
    if (form.end_date) payload.end_date = form.end_date;

    const res = await api.post(apiEndpoints.clients, payload);

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
        {/* Section 1: Basic Company & Client Info */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-cyan-400" />
              General Information
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Core brand identity and primary contact</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client / Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Client / Brand Name <span className="text-red-400">*</span>
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

            {/* Legal Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-slate-200">
                Company Legal Name
              </Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => setField('company_name', e.target.value)}
                placeholder="e.g. Acme International Pvt Ltd"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="contact_person" className="text-slate-200">
                Primary Contact Person
              </Label>
              <Input
                id="contact_person"
                value={form.contact_person}
                onChange={(e) => setField('contact_person', e.target.value)}
                placeholder="e.g. Jane Doe (Marketing Director)"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-slate-200">
                Industry / Niche
              </Label>
              <Input
                id="industry"
                value={form.industry}
                onChange={(e) => setField('industry', e.target.value)}
                placeholder="e.g. E-Commerce, Fitness, SaaS"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_INDUSTRIES.slice(0, 4).map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => setField('industry', ind)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5"
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-slate-200">
                Description / Brand Overview
              </Label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Brief summary of the brand, target audience, and video content goals..."
                className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ring-offset-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Social Presence */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-400" />
              Contact & Social Presence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Communication channels and Instagram brand assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Email Address
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

            {/* Phone */}
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

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-slate-200 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                Website URL
              </Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setField('website', e.target.value)}
                placeholder="https://acme.com"
                className={cn(
                  'bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500',
                  fieldErrors.website && 'border-red-500/80 focus-visible:ring-red-500'
                )}
              />
              {fieldErrors.website && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.website}</p>
              )}
            </div>

            {/* Instagram Username */}
            <div className="space-y-2">
              <Label htmlFor="instagram_username" className="text-slate-200 flex items-center gap-1.5">
                <Instagram className="h-3.5 w-3.5 text-pink-400" />
                Instagram Handle
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  @
                </span>
                <Input
                  id="instagram_username"
                  value={form.instagram_username}
                  onChange={(e) => setField('instagram_username', e.target.value)}
                  placeholder="acme_official"
                  className="pl-8 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Instagram URL */}
            <div className="space-y-2">
              <Label htmlFor="instagram_url" className="text-slate-200">
                Instagram Profile URL
              </Label>
              <Input
                id="instagram_url"
                value={form.instagram_url}
                onChange={(e) => setField('instagram_url', e.target.value)}
                placeholder="https://instagram.com/acme_official"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-200 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Business Address
              </Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Suite 400, 100 Main St, New York, NY"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Status, Manager & Timeline */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-400" />
              Account Management & Timeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Client status, designated account manager, and contract period
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-200">
                Client Status
              </Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ring-offset-slate-900 capitalize"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Manager */}
            <div className="space-y-2">
              <Label htmlFor="assigned_manager" className="text-slate-200 flex items-center justify-between">
                <span>Assigned Account Manager</span>
                {managersLoading && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading managers...
                  </span>
                )}
              </Label>
              <select
                id="assigned_manager"
                value={form.assigned_manager}
                onChange={(e) => setField('assigned_manager', e.target.value)}
                className={cn(
                  'w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ring-offset-slate-900',
                  fieldErrors.assigned_manager && 'border-red-500/80 focus-visible:ring-red-500'
                )}
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  Select a Manager (or leave unassigned)
                </option>
                {(managers || []).map((m: any) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.full_name || m.username} ({m.email})
                  </option>
                ))}
              </select>
              {fieldErrors.assigned_manager && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.assigned_manager}</p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-slate-200 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Contract / Start Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => setField('start_date', e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-slate-200 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Contract / End Date
              </Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => setField('end_date', e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>

            {/* Internal Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes" className="text-slate-200 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Internal Notes & Specifics
              </Label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Important client expectations, video delivery preferences, shoot guidelines..."
                className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ring-offset-slate-900"
              />
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
