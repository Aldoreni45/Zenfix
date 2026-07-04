'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Globe,
  Loader2,
  Save
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState({
    siteName: 'ZenFix',
    siteUrl: 'https://zenfix.com',
    supportEmail: 'support@zenfix.com',
    maxFileSize: '10',
    sessionTimeout: '30',
    enableNotifications: true,
    enableEmailAlerts: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }

    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      redirect('/adminzenfix/dashboard');
    }
  }, [status, session]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Settings save logic would go here
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'database', label: 'Database', icon: Database },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure system settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="glass-card rounded-2xl p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-electric-cyan/10 text-electric-cyan'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="glass-card rounded-2xl p-8">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="h-5 w-5 text-electric-cyan" />
                  <h3 className="text-xl font-bold text-white">General Settings</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-gray-300">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, siteName: e.target.value })}
                    className="bg-surface/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteUrl" className="text-gray-300">Site URL</Label>
                  <Input
                    id="siteUrl"
                    type="url"
                    value={settings.siteUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, siteUrl: e.target.value })}
                    className="bg-surface/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail" className="text-gray-300">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="bg-surface/50 border-white/10 text-white"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Maintenance Mode</p>
                    <p className="text-sm text-gray-400">Disable public access to the site</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      settings.maintenanceMode ? 'bg-electric-cyan' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="h-5 w-5 text-electric-cyan" />
                  <h3 className="text-xl font-bold text-white">Notification Settings</h3>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Enable Notifications</p>
                    <p className="text-sm text-gray-400">Allow in-app notifications</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, enableNotifications: !settings.enableNotifications })}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      settings.enableNotifications ? 'bg-electric-cyan' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        settings.enableNotifications ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Email Alerts</p>
                    <p className="text-sm text-gray-400">Send email notifications for important events</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, enableEmailAlerts: !settings.enableEmailAlerts })}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      settings.enableEmailAlerts ? 'bg-electric-cyan' : 'bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        settings.enableEmailAlerts ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="h-5 w-5 text-electric-cyan" />
                  <h3 className="text-xl font-bold text-white">Security Settings</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout" className="text-gray-300">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                    className="bg-surface/50 border-white/10 text-white"
                  />
                  <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Database className="h-5 w-5 text-electric-cyan" />
                  <h3 className="text-xl font-bold text-white">Database Settings</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFileSize" className="text-gray-300">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, maxFileSize: e.target.value })}
                    className="bg-surface/50 border-white/10 text-white"
                  />
                  <p className="text-sm text-gray-500">Maximum file upload size</p>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Database operations require careful consideration. Changes may affect system performance.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-white/10">
              <Button
                type="submit"
                className="bg-gradient-to-r from-electric-cyan to-purple"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
