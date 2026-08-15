import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Cpu, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { createClient } from '../lib/supabase/client';

const supabase = createClient();

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      console.log('User detected, role:', user.role);
      // TEMPORARY BYPASS: Force redirect to Melly for the owner email
      if (user.role === 'owner' || user.email === 'miraclefranize3@gmail.com') {
        console.log('Navigating to /melly (Bypass enabled)');
        navigate('/melly');
      } else {
        console.log('Navigating to /dashboard');
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] flex items-center justify-center font-mono relative overflow-hidden text-slate-300">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black border-2 border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent"></div>
            <Terminal className="w-8 h-8 text-cyan-400 relative z-10" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase text-center">Identity Sync</h1>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full p-3 bg-black/40 border border-white/10 rounded-lg"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full p-3 bg-black/40 border border-white/10 rounded-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Authenticate'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm">
            Need an account? <Link to="/register" className="text-cyan-400">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
