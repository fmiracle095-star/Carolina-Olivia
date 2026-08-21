import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@/src/lib/AuthContext';

export function ChatHeader() {
  const { user } = useAuth();
  
  return (
    <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md absolute top-0 w-full z-10">
      <div className="flex items-center gap-3">
        <h1 className="font-medium text-slate-900 dark:text-slate-100">Carolina-Olivia Assistant</h1>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
          Ready
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
          <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </div>
      </div>
    </div>
  );
}
