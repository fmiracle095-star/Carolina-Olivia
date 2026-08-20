'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { User, Shield, ArrowLeft, Save, Activity, CheckCircle } from 'lucide-react';
import { useAuth } from '@/src/lib/AuthContext';

import { Providers } from "@/src/components/Providers";

export default function ProfileWrapper() {
  return <Providers><Profile /></Providers>;
}

function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const router = useRouter();
  const { supabase, session, user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data, error }: any) => {
          if (data) {
            setProfile(data);
          } else {
            setProfile({
              id: user.id,
              name: user.user_metadata?.name || 'Operator',
              email: user.email,
              created_at: user.created_at
            });
          }
          setProfileLoading(false);
        });
      }
    }
  }, [loading, user, router, supabase]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#020205] text-slate-300 flex items-center justify-center font-mono">
        <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 font-mono relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293705_1px,transparent_1px),linear-gradient(to_bottom,#1f293705_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <nav className="relative z-10 w-full bg-black/60 border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
            RETURN TO OPERATIONAL SECTORS
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-8 relative z-10 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/60 border border-white/10 rounded-2xl p-8 space-y-6 backdrop-blur-md"
        >
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <User className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-widest text-white uppercase">Operator Parameters</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Identity Core Config</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operator ID Reference</label>
              <div className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-slate-500 font-mono select-all">
                {profile?.id}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operator Call-Sign (Name)</label>
              <div className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-slate-300 font-mono">
                {profile?.name}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Secure Comms Routing (Email)</label>
              <div className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-slate-300 font-mono">
                {profile?.email || 'N/A'}
              </div>
            </div>
            {profile?.created_at && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Join Date</label>
              <div className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-slate-300 font-mono">
                {new Date(profile.created_at).toLocaleString()}
              </div>
            </div>
            )}
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400">
              Editing operator parameters is currently locked pending infrastructure validation.
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
