import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <AlertTriangle className="w-20 h-20 text-red-500/80 mb-6" />
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-200 mb-4 font-mono">404</h1>
        <h2 className="text-xl md:text-2xl text-red-400 uppercase tracking-widest font-mono mb-8">Signal Lost in Space</h2>
        
        <p className="text-slate-400 max-w-md mx-auto mb-10 font-light">
          The coordinates you entered do not match any known sectors within the Carolina AI Portal architecture.
        </p>
        
        <Link 
          to="/" 
          className="px-8 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium tracking-wider transition-all backdrop-blur-md flex items-center justify-center gap-3"
        >
          <Home className="w-5 h-5" />
          RETURN TO BASE
        </Link>
      </motion.div>
    </div>
  );
}
