import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertTriangle, KeyRound } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const applyCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Premium ambient light spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-850 rounded-3xl shadow-2xl p-8 relative z-10 transition-all hover:border-slate-700/50">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 rounded-2xl mb-4 text-indigo-400 shadow-inner">
            <Shield className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Forensic Custody Hub
          </h1>
          <p className="text-slate-500 text-xs mt-1 text-center font-medium tracking-wide">
            FEDERAL MANAGEMENT & OPERATIONS SUITE
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Officer Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@forensics.gov"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Security Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold rounded-2xl text-xs transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Verify Signature'
            )}
          </button>
        </form>

        {/* Quick Demo Login Help Panel */}
        <div className="mt-8 pt-6 border-t border-slate-900">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-3 ml-1 uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select Demo Officer Profile</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => applyCredentials('admin@forensics.gov', 'admin123')}
              className="text-left p-3 bg-slate-950/40 hover:bg-slate-950/90 border border-slate-900 hover:border-slate-800 rounded-2xl text-xs text-slate-300 flex justify-between items-center transition-all group cursor-pointer"
            >
              <div>
                <span className="font-bold block text-slate-200">System Admin</span>
                <span className="text-[10px] text-slate-500 font-medium">admin@forensics.gov</span>
              </div>
              <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-indigo-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all">Sign In</span>
            </button>

            <button
              onClick={() => applyCredentials('investigator@forensics.gov', 'investigator123')}
              className="text-left p-3 bg-slate-950/40 hover:bg-slate-950/90 border border-slate-900 hover:border-slate-800 rounded-2xl text-xs text-slate-300 flex justify-between items-center transition-all group cursor-pointer"
            >
              <div>
                <span className="font-bold block text-slate-200">Lead Investigator</span>
                <span className="text-[10px] text-slate-500 font-medium">investigator@forensics.gov</span>
              </div>
              <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-indigo-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all">Sign In</span>
            </button>

            <button
              onClick={() => applyCredentials('analyst@forensics.gov', 'analyst123')}
              className="text-left p-3 bg-slate-950/40 hover:bg-slate-950/90 border border-slate-900 hover:border-slate-800 rounded-2xl text-xs text-slate-300 flex justify-between items-center transition-all group cursor-pointer"
            >
              <div>
                <span className="font-bold block text-slate-200">DNA Analyst</span>
                <span className="text-[10px] text-slate-500 font-medium">analyst@forensics.gov</span>
              </div>
              <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-indigo-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all">Sign In</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
