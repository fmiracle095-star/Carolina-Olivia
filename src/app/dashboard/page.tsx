'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  User, Shield, Terminal, Database, Activity, Cpu, 
  LogOut, ArrowRight, Settings
} from 'lucide-react';
import { useAuth } from '@/src/lib/AuthContext';

import { Providers } from "@/src/components/Providers";

export default function DashboardWrapper() {
  return <Providers><Dashboard /></Providers>;
}

function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const router = useRouter();
  const { supabase, session, user, loading, isOwner } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data, error }: any) => {
          if (data) {
            setProfile(data);
          }
          setProfileLoading(false);
        });
      }
    }
  }, [loading, user, router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#020205] text-slate-300 flex items-center justify-center font-mono">
        <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const sectors = [
    {
      title: 'Identity',
      description: 'Manage your operator profile, secure credentials, and system preferences.',
      icon: User,
      href: '/profile',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30'
    },
    ...(isOwner ? [{
      title: 'Melly Core',
      description: 'Access the primary conversational AI module and command terminal.',
      icon: Terminal,
      href: '/melly',
      color: 'text-magenta-400',
      bg: 'bg-magenta-500/10',
      border: 'border-magenta-500/30'
    }] : []),
    {
      title: 'Security',
      description: 'Review access logs, manage cryptographic keys, and firewall rules.',
      icon: Shield,
      href: '/404',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },
    {
      title: 'Data Vault',
      description: 'Securely access encrypted files, operational data, and external backups.',
      icon: Database,
      href: '/404',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30'
    },
    {
      title: 'Diagnostics',
      description: 'Real-time telemetry, memory state, and CPU architectural metrics.',
      icon: Activity,
      href: '/404',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30'
    },
    {
      title: 'System Settings',
      description: 'Modify environmental variables and core architectural constraints.',
      icon: Settings,
      href: '/404',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 font-mono relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      
      <nav className="relative z-10 w-full bg-black/80 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <span className="text-white font-bold tracking-widest uppercase">Command Center</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400 hidden sm:block">
            Operator: <span className="text-white font-bold">{profile?.name || user?.email || 'UNKNOWN'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded transition-all bg-white/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            DISCONNECT
          </button>
        </div>
      </nav>

      <main className="flex-1 p-8 relative z-10 max-w-7xl mx-auto w-full">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-12"
        >
          <h1 className="text-4xl font-bold tracking-widest text-white mb-2 uppercase">Operational Sectors</h1>
          <p className="text-slate-400 text-sm">Select a module to initiate access sequence.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector, index) => {
            const Icon = sector.icon;
            return (
              <motion.div
                key={sector.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 ${sector.bg} blur-[50px] rounded-full pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity`} />
                
                <div className="p-6 relative z-10 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-xl border ${sector.border} ${sector.bg} flex items-center justify-center mb-6`}>
                    <Icon className={`w-6 h-6 ${sector.color}`} />
                  </div>
                  
                  <div className="mb-6 flex-1">
                    <h2 className="text-lg text-white font-bold tracking-wide uppercase mb-2">{sector.title}</h2>
                    <p className="text-slate-400 text-sm">{sector.description}</p>
                  </div>
                  
                  <Link 
                     href={sector.href}
                     className={`inline-flex items-center text-xs ${sector.color} uppercase tracking-widest font-bold hover:brightness-125 transition-all w-fit`}
                  >
                    Access {sector.title} <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
