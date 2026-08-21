'use client';

import React from 'react';
import { Providers } from "@/src/components/Providers";
import { AppShell } from "@/src/components/layout/AppShell";
import { useAuth } from '@/src/lib/AuthContext';
import { useRouter } from 'next/navigation';
import NotFound from '@/src/app/not-found';
import { motion } from 'motion/react';
import { Cpu, Activity } from 'lucide-react';

function MellyContent() {
  const { isOwner, user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isOwner) {
    return <NotFound />;
  }

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 lg:px-8 py-8 bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 max-w-lg w-full shadow-sm"
        >
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Cpu className="w-10 h-10 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Melly Core Configurator</h1>
          <p className="text-slate-500 dark:text-slate-400">
            The Melly conversational module is actively synchronizing. Secure communications channel establishment is pending full provider credential provisioning.
          </p>
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium flex items-center justify-center gap-2">
              <Activity className="w-4 h-4" />
              Owner Privileges Verified
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function MellyWrapper() {
  return (
    <Providers>
      <AppShell>
        <MellyContent />
      </AppShell>
    </Providers>
  );
}
