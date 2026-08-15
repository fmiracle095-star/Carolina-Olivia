import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Shield, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col">
      <nav className="w-full bg-black/40 border-b border-white/5 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-slate-200 font-medium tracking-widest font-mono text-sm uppercase">Operator Profile</h1>
      </nav>

      <main className="flex-1 p-6 md:p-12 flex justify-center">
        <div className="w-full max-w-2xl bg-white/[0.02] border border-white/5 rounded-2xl p-8 backdrop-blur-md">
          <div className="flex items-center gap-6 mb-10 pb-8 border-b border-white/10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-900 to-black border border-cyan-500/30 flex items-center justify-center">
              <span className="text-3xl text-cyan-400 font-mono font-bold uppercase">{user?.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
              <User className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-1">Designation</p>
                <p className="text-slate-200 font-medium">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
              <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-1">Comms Link</p>
                <p className="text-slate-200 font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
              <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-1">Security Clearance</p>
                <p className="text-slate-200 font-medium capitalize">{user?.role}</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm text-slate-400 font-mono">
              Profile modifications are currently disabled in this build.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
