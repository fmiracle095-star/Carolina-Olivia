import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Cpu, Terminal, ShieldAlert } from 'lucide-react';

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-[#05050a] overflow-hidden flex flex-col items-center justify-center">
      {/* Ambient background particles/glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-magenta-900/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
          <Cpu className="w-16 h-16 text-cyan-400 relative z-10 mx-auto mb-6" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-cyan-100 to-cyan-500 bg-clip-text text-transparent"
        >
          CAROLINA OLIVIA
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light tracking-wide"
        >
          A futuristic personal AI experience. Built for local automation, extreme privacy, and modular intelligence.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full sm:w-auto"
        >
          <Link 
            to="/register" 
            className="w-full sm:w-48 py-3 px-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 text-cyan-300 font-medium tracking-wide transition-all duration-300 backdrop-blur-md flex items-center justify-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            INITIALIZE
          </Link>
          <Link 
            to="/login" 
            className="w-full sm:w-48 py-3 px-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium tracking-wide transition-all duration-300 backdrop-blur-md flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            AUTHENTICATE
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-600 tracking-[0.2em] font-mono">
        SYSTEM BUILD :: 2050.1.0-RC
      </div>
    </div>
  );
}
