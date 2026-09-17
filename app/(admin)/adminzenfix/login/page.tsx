'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  // Redirect if already authenticated (in effect to avoid setState during render)
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/adminzenfix/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-white">Z</span>
          </div>
          <p className="text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials);

    if (result.success) {
      router.push('/adminzenfix/dashboard');
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md p-8">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">Z</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400">Sign in to your ZenFix account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Help Links */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Forgot your password?{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300">
                Reset here
              </a>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-slate-500 text-xs text-center mb-3">Demo Credentials</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Owner:</span>
                <span className="text-slate-300">admin / awo40Rf2x4JDG5kd</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Manager:</span>
                <span className="text-slate-300">manager / 8OMv01oyKY3gXaxh</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Employee:</span>
                <span className="text-slate-300">employee / YW2hUC2O2YUfdTku</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            © 2026 ZenFix. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}