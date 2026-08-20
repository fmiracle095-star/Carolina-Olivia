'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Shield, Mail, ArrowLeft, Activity, CheckCircle } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to request recovery link.');
    } finally {
      setLoading(false);
    }
  };

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
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase">Account Recovery</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enter the email address associated with your account.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-bold">
            [ACCESS_DENIED]: {error}
          </div>
        )}

        {success ? (
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-center space-y-3">
            <CheckCircle className="w-8 h-8 text-cyan-400 mx-auto" />
            <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Recovery Link Transmitted</p>
            <p className="text-[10px] text-slate-400">Please check your inbox to reset your passkey.</p>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                placeholder="operator@carolina.ai"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/20 text-black font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  TRANSMITTING...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  SEND RECOVERY LINK
                </>
              )}
            </button>
          </form>
        )}

        <div className="border-t border-white/5 pt-4 text-center">
          <Link href="/login" className="text-[10px] text-slate-600 hover:text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Return to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
