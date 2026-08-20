'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 font-mono flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293705_1px,transparent_1px),linear-gradient(to_bottom,#1f293705_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="w-full max-w-md bg-black/60 border border-red-500/30 rounded-2xl p-8 relative z-10 backdrop-blur-md space-y-6 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-red-400 uppercase">ACCESS SEQUENCE BLOCKED</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">ERROR 404: SECTOR NOT REGISTERED</p>
        </div>
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-left text-[11px] leading-relaxed text-slate-400 space-y-2">
          <p className="font-bold text-red-400">[SYSTEM_ALERT]:</p>
          <p>The requested operations sector is unmapped or requires superior clearance keys to authenticate routing paths.</p>
          <p>Please contact superior controller or return to terminal root hub.</p>
        </div>
        <Link href="/dashboard" className="w-full py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-black font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          RETURN TO SECTOR HUB
        </Link>
      </div>
    </div>
  );
}
