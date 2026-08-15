import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, User, Activity, MessageSquareOff, Settings } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col relative overflow-hidden">
      {/* Top Navigation */}
      <nav className="w-full bg-black/40 border-b border-white/5 backdrop-blur-md px-6 py-4 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-slate-200 font-medium tracking-widest font-mono text-sm uppercase">Carolina Portal</span>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'owner' && (
            <Link to="/melly" className="p-2 text-slate-400 hover:text-cyan-400 transition-colors" title="Control Center">
              <Settings className="w-5 h-5" />
            </Link>
          )}
          <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors text-sm font-medium">
            <User className="w-4 h-4" />
            {user?.name}
          </Link>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 relative z-10 flex flex-col md:flex-row gap-6 max-w-7xl w-full mx-auto">
        
        {/* Left Sidebar Status */}
        <aside className="w-full md:w-80 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <h3 className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Core Logic</span>
                <span className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Termux Agent</span>
                <span className="text-sm font-medium text-slate-500">STANDBY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">AI Routing</span>
                <span className="text-sm font-medium text-amber-400">INITIALIZING</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Chat Area */}
        <div className="flex-1 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col overflow-hidden relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-full bg-cyan-900/5 blur-[120px] pointer-events-none" />
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6"
            >
              <MessageSquareOff className="w-10 h-10 text-cyan-400/50" />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-wide text-slate-200 mb-2 font-mono">CAROLINA CHAT</h2>
            <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-widest mb-6">
              COMING SOON
            </div>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed font-light">
              Carolina Olivia's primary AI interaction interface is currently under development. 
              The underlying routing architecture and provider integrations are being established.
            </p>
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between text-slate-500 cursor-not-allowed">
              <span className="text-sm">Transmission channel offline...</span>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <div className="w-4 h-4 bg-slate-600 rounded-sm" />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
