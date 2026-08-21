'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { useAuth } from '@/src/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex-1 flex flex-col md:pl-64 h-screen">
        <header className="md:hidden h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 bg-white dark:bg-slate-950">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-semibold ml-2">Carolina</div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
