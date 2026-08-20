'use client';

import { useAuth } from '@/src/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import NotFound from '@/src/app/not-found';
import { motion } from 'motion/react';

import { Providers } from "@/src/components/Providers";

export default function MellyWrapper() {
  return <Providers><Melly /></Providers>;
}

function Melly() {
  const { loading, user, isOwner } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020205] text-slate-300 flex items-center justify-center font-mono">
        <Activity className="w-8 h-8 text-magenta-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isOwner) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 font-mono relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      
      <nav className="relative z-10 w-full bg-black/80 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
            RETURN
          </Link>
          <div className="w-3 h-3 rounded-full bg-magenta-500 shadow-[0_0_10px_rgba(236,72,153,0.8)] ml-4" />
          <span className="text-white font-bold tracking-widest uppercase">Melly Control Center</span>
        </div>
      </nav>

      <main className="flex-1 p-8 relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full bg-black/40 border border-white/10 rounded-2xl p-8 space-y-6 text-center backdrop-blur-md"
        >
          <h2 className="text-2xl font-bold tracking-widest text-magenta-400 uppercase">Awaiting Gateway Integration</h2>
          <p className="text-slate-400 text-sm">
            The Melly conversational module is actively synchronizing with the Carolina Gateway. Secure communications channel establishment is pending full provider credential provisioning.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
