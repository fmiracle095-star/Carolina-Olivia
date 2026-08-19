'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { User, Shield, ArrowLeft, Save, Activity, CheckCircle } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data, error }) => {
          if (data) {
            setProfile(data);
            setName(data.name || '');
          } else {
            // Fallback profile if row doesn't exist yet
            const fallback = { id: user.id, name: user.user_metadata?.name || 'Operator Delta', email: user.email };
            setProfile(fallback);
            setName(fallback.name);
          }
        });
      } else {
        router.push('/login');
      }
    });
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updating) return;
    setUpdating(true);
    setStatus(null);

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: profile.id,
        name,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      setStatus('Profile sequence successfully synchronized.');
      setProfile(prev => ({ ...prev, name }));
    } catch (err: any) {
      // If table doesn't support profiles updates directly or profile table is missing,
      // update auth metadata instead as a valid runtime fallback
      const { error: authError } = await supabase.auth.updateUser({
        data: { name }
      });
      if (authError) {
        setStatus(`Error synchronizing parameters: ${authError.message}`);
      } else {
        setStatus('Profile parameters updated successfully in metadata.');
        setProfile(prev => ({ ...prev, name }));
      }
    } finally {
      setUpdating(false);
    }
  };

  if (!profile) {
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

          {status && (
            <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{status}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operator ID Reference</label>
              <div className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-slate-500 font-mono select-all">
                {profile.id}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operator Call-Sign (Name)</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Secure Comms Routing (Email)</label>
              <div className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-slate-500 font-mono">
                {profile.email || 'N/A'}
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/20 text-black font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
            >
              {updating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  SYNCHRONIZING PATH...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  SYNCHRONIZE OPERATOR PARAMETERS
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
