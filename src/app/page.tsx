'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Terminal, Shield, Cpu, Activity, User, ArrowRight,
  LogIn, UserPlus, Zap, RefreshCw, Server, Database
} from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [probing, setProbing] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    database: "NOT CONNECTED",
    vault: "NOT CONFIGURED",
    aiRouter: "STANDBY",
    provider: "NOT CONFIGURED",
    termux: "UNAVAILABLE"
  });
  const [probeLogs, setProbeLogs] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, [supabase]);

  const handleProbe = async () => {
    setProbing(true);
    setProbeLogs(['> INITIATING SYSTEM PROBE SEQUENCE...']);
    setTimeout(() => {
      setProbeLogs(prev => [...prev, '> CHECKING GATEWAY SYSTEM STATUS...']);
      setSystemStatus({
        database: "ONLINE",
        vault: "CONNECTED",
        aiRouter: "ACTIVE",
        provider: "READY",
        termux: "SYNCED"
      });
      setProbing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 font-mono flex flex-col justify-between relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293705_1px,transparent_1px),linear-gradient(to_bottom,#1f293705_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Top Navbar */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto p-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-sm font-bold tracking-wider text-white uppercase">CAROLINA OLIVIA</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white border border-white/5 hover:border-white/20 rounded transition-all bg-white/5"
          >
            <LogIn className="w-3.5 h-3.5" />
            CONSOLE LOGIN
          </Link>
        </div>
      </nav>

      {/* Main Content Split */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Side: Identity & Description */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-400 font-bold tracking-widest uppercase">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              CYBERNETIC COGNITION UNIT
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none">
              Carolina <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-500">
                Olivia AI
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
              Welcome to the Year 2050 Operations Interface. Access secure server systems, 
              orchestrate decentralized AI Routers, and synchronize secure Termux client daemons.
            </p>
          </div>

          {/* Action CTA Block */}
          <div className="flex flex-wrap gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-sm tracking-wider transition-all uppercase shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02]"
              >
                Access Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-sm tracking-wider transition-all uppercase shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02]"
                >
                  CONSOLE LINK
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-3 px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-wider transition-all uppercase hover:scale-[1.02]"
                >
                  <UserPlus className="w-4 h-4" />
                  Operator Register
                </Link>
              </>
            )}
          </div>

          {/* Node Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <Server className="w-5 h-5 text-slate-500" />
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Router</div>
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                {systemStatus.aiRouter}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <Database className="w-5 h-5 text-magenta-400" />
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Supabase DB</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Termux Link</div>
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                {systemStatus.termux}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <Shield className="w-5 h-5 text-slate-500" />
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Server Vault</div>
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                {systemStatus.vault}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Probing Console */}
        <div className="lg:col-span-5 h-full flex flex-col">
          <div className="flex-1 bg-black/60 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-md">
            {/* Console Header */}
            <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Diag-Terminal</span>
              </div>
              <button
                onClick={handleProbe}
                disabled={probing}
                className="flex items-center gap-1.5 text-[10px] uppercase font-bold px-2 py-1 border border-cyan-500/30 hover:border-cyan-400/80 rounded text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${probing ? 'animate-spin' : ''}`} />
                PROBE NODES
              </button>
            </div>
            {/* Console Output area */}
            <div className="p-4 flex-1 font-mono text-[11px] leading-relaxed space-y-2.5 overflow-y-auto max-h-[280px] min-h-[180px] scrollbar-thin text-slate-400 bg-black/20">
              {probeLogs.length === 0 ? (
                <div className="text-slate-500 italic flex flex-col justify-center items-center h-full gap-2">
                  <span>Terminal idle. Initiate probe sequence to check sync paths.</span>
                </div>
              ) : (
                probeLogs.map((log, idx) => (
                  <div key={idx} className={`${idx === probeLogs.length - 1 && !probing ? 'text-cyan-400 font-bold' : ''}`}>
                    {log}
                  </div>
                ))
              )}
              {probing && (
                <div className="flex items-center gap-1.5 text-cyan-400 animate-pulse font-bold">
                  <span>&gt; SYNC_IN_PROGRESS</span>
                  <span className="w-1.5 h-3 bg-cyan-400 animate-ping" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-6 border-t border-white/5 text-[10px] text-slate-600 uppercase tracking-widest">
        <span>© 2050 Carolina Olivia Systems Inc. Decoupled Architecture Portal.</span>
      </footer>
    </div>
  );
}
