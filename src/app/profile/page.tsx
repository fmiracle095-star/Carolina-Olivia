'use client';

import React, { useEffect, useState } from 'react';
import { Providers } from "@/src/components/Providers";
import { AppShell } from "@/src/components/layout/AppShell";
import { useAuth } from '@/src/lib/AuthContext';
import { User, Activity } from 'lucide-react';
import { motion } from 'motion/react';

function ProfileContent() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { supabase, user } = useAuth();

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }: any) => {
        if (data) {
          setProfile(data);
        } else {
          setProfile({
            id: user.id,
            name: user.user_metadata?.name || 'Operator',
            email: user.email,
            created_at: user.created_at
          });
        }
        setProfileLoading(false);
      });
    }
  }, [user, supabase]);

  if (profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 lg:px-8 py-8 bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Identity & Profile</h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm"
        >
          <div className="flex items-center gap-6 pb-8 border-b border-slate-200 dark:border-slate-800 mb-8">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <User className="w-10 h-10 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile?.name}</h2>
              <p className="text-slate-500">{profile?.email}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">User ID</label>
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-600 dark:text-slate-400 break-all select-all">
                {profile?.id}
              </div>
            </div>
            
            {profile?.created_at && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Created</label>
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-400">
                  {new Date(profile.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              </div>
            )}
            
            <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                Identity editing is currently disabled while system integration is ongoing.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ProfileWrapper() {
  return (
    <Providers>
      <AppShell>
        <ProfileContent />
      </AppShell>
    </Providers>
  );
}
