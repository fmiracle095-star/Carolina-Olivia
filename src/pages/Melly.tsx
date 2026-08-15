import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { apiFetch } from '../lib/api';
import { ArrowLeft, Activity, Server, Cpu, Key, Terminal, Code } from 'lucide-react';
import ConnectTab from './melly/ConnectTab';
import CredentialsTab from './melly/CredentialsTab';
import CommandTab from './melly/CommandTab';

export default function Melly() {
  const [activeTab, setActiveTab] = useState('overview');
  const { token } = useAuth();
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/melly/status', token)
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(console.error);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'connect', label: 'Carolina Connect', icon: Server },
    { id: 'router', label: 'AI Router', icon: Cpu },
    { id: 'credentials', label: 'Credentials', icon: Key },
    { id: 'command', label: 'Command Center', icon: Terminal },
    { id: 'persona', label: 'Persona', icon: Code },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-xl text-slate-100 font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-4">System Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-black/60 border border-white/10 rounded-lg">
                <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-4">Core Status</h3>
                <div className="text-2xl text-cyan-400 font-bold">{status?.status || 'UNKNOWN'}</div>
                <div className="text-xs text-slate-500 mt-2">Uptime: {status ? Math.floor(status.uptime / 60) : 0} mins</div>
                <div className="text-xs text-slate-600 mt-1">Build: {status?.version || 'Unknown'}</div>
              </div>
              
              <div className="p-6 bg-black/60 border border-white/10 rounded-lg">
                <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-4">Termux Agent</h3>
                <div className="text-2xl text-amber-500 font-bold">DISCONNECTED</div>
                <div className="text-xs text-slate-500 mt-2">Awaiting authentication link</div>
              </div>
              
              <div className="p-6 bg-black/60 border border-white/10 rounded-lg">
                <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-4">Active Provider</h3>
                <div className="text-2xl text-slate-300 font-bold">NONE</div>
                <div className="text-xs text-slate-500 mt-2">Routing requires configuration</div>
              </div>
            </div>
          </motion.div>
        );
      case 'connect':
        return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ConnectTab /></motion.div>;
      case 'credentials':
        return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><CredentialsTab /></motion.div>;
      case 'command':
        return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><CommandTab /></motion.div>;
      case 'persona':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl text-slate-100 font-bold uppercase tracking-widest">Persona Editor</h2>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-lg p-6">
              <h3 className="text-cyan-400 font-mono font-bold mb-4">Current: SHADOWHacker-GOD-Ω</h3>
              <textarea 
                className="w-full h-64 bg-black/60 border border-white/5 rounded p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                defaultValue={"You are Carolina Olivia...\n[Persona editing is currently locked for this phase of architecture rollout.]"}
                readOnly
              />
            </div>
          </motion.div>
        );
      default:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center border border-white/5 bg-black/20 rounded-lg border-dashed">
            <div className="text-center">
              <div className="text-cyan-500/50 mb-4 flex justify-center">
                <Activity className="w-12 h-12" />
              </div>
              <h2 className="text-lg text-slate-400 uppercase tracking-widest mb-2">Module Offline</h2>
              <p className="text-sm text-slate-600">The {tabs.find(t => t.id === activeTab)?.label} module is undergoing architectural implementation.</p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 flex flex-col font-mono selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Heavy grid background for Melly */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Top Nav */}
      <nav className="relative z-10 w-full bg-black/80 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 text-slate-500 hover:text-cyan-400 transition-colors bg-white/5 rounded-md border border-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
            <span className="text-cyan-400 font-bold tracking-widest uppercase">MELLY CONTROL CENTER</span>
          </div>
        </div>
        <div className="text-xs text-slate-500 tracking-widest">
          SYS_TIME: {new Date().toISOString().split('T')[1].split('.')[0]} Z
        </div>
      </nav>

      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <aside className="w-64 bg-black/40 border-r border-white/10 flex flex-col">
          <div className="p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider uppercase transition-all border-l-2 ${
                  activeTab === tab.id 
                    ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300' 
                    : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
