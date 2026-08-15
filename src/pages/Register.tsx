import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, Loader2, Terminal } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

const supabase = createClient();

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError('Passcodes do not match.');
    }
    
    if (password.length < 8) {
      return setError('Passcode must be at least 8 characters.');
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Trigger handles user insertion in DB.
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#020205] flex items-center justify-center font-mono relative overflow-hidden text-slate-300">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-magenta-900/10 via-transparent to-cyan-900/10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-black/40 border border-white/10 rounded-2xl mb-4 backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-magenta-500/10 rounded-2xl blur-xl" />
            <Terminal className="w-8 h-8 text-magenta-400 relative z-10" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Operator Onboarding</h1>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1">Designation</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-magenta-500 focus:ring-1 focus:ring-magenta-500 transition-all"
                placeholder="Operator Alpha"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1">Comms Link</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="alpha@carolina.ai"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1">Passcode</label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1">Confirm</label>
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-magenta-600 hover:bg-magenta-500 text-white font-bold tracking-wider transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(192,38,211,0.2)] hover:shadow-[0_0_30px_rgba(192,38,211,0.4)]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'INITIALIZE'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-mono">
            Already have an active link? <Link to="/login" className="text-magenta-400 hover:text-white transition-colors uppercase tracking-wider">Authenticate</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
