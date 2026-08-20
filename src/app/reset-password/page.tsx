'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Shield, Key, ArrowLeft, Activity, CheckCircle, RefreshCcw } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Check if we have an active session (which implies a valid recovery link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Also listen for auth state changes just in case it takes a moment to process the fragment
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setHasSession(true);
        }
        setSessionChecked(true);
      });

      if (session) {
        setHasSession(true);
      }
      setSessionChecked(true);
    };

    checkSession();
  }, [supabase.auth]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      setError("Passkeys do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Passkey must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update passkey.');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-[#020205] text-slate-300 font-mono flex items-center justify-center p-4">
         <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!hasSession && !success) {
    return (
      <div className="min-h-screen bg-[#020205] text-slate-300 font-mono flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293705_1px,transparent_1px),linear-gradient(to_bottom,#1f293705_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-black/60 border border-red-500/30 rounded-2xl p-8 relative z-10 backdrop-blur-md space-y-6 text-center"
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-red-400 uppercase">ACCESS DENIED</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Recovery link expired or invalid.</p>
          
          <Link
            href="/forgot-password"
            className="mt-6 w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" /> Request a new recovery link
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 font-mono flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293705_1px,transparent_1px),linear-gradient(to_bottom,#1f293705_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black/60 border border-white/10 rounded-2xl p-8 relative z-10 backdrop-blur-md space-y-6"
      >
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-2">
            <Key className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase">Reset Operator Credential</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Establish a new secure passkey</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-bold">
            [UPDATE_FAILED]: {error}
          </div>
        )}

        {success ? (
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-center space-y-3">
            <CheckCircle className="w-8 h-8 text-cyan-400 mx-auto" />
            <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Password successfully updated.</p>
            
            <Link
              href="/login"
              className="mt-4 w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs tracking-widest uppercase transition-all flex flex-row items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 inline-flex"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">New Passkey</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                placeholder="••••••••••••"
                minLength={6}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Confirm New Passkey</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                placeholder="••••••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/20 text-black font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  UPDATING CREDENTIAL...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  UPDATE PASSKEY
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
