'use client';

import React from 'react';
import { Providers } from "@/src/components/Providers";
import { AppShell } from "@/src/components/layout/AppShell";
import { motion } from 'motion/react';
import { Bell, Shield, Monitor, Sliders, ChevronRight } from 'lucide-react';

function SettingsContent() {
  const sections = [
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the look and feel of your workspace.',
      icon: Monitor,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage how and when you receive alerts.',
      icon: Bell,
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Update your security preferences and active sessions.',
      icon: Shield,
    },
    {
      id: 'preferences',
      title: 'Application Preferences',
      description: 'Configure advanced application behavior and language models.',
      icon: Sliders,
    }
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 lg:px-8 py-8 bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        
        <div className="space-y-4">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{section.title}</h3>
                    <p className="text-sm text-slate-500">{section.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </motion.div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
}

export default function SettingsWrapper() {
  return (
    <Providers>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </Providers>
  );
}
