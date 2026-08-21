'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Settings, 
  User, 
  LogOut, 
  Cpu, 
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '@/src/lib/AuthContext';
import { useRouter } from 'next/navigation';

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { isOwner, supabase } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    setMobileOpen(false);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Chat', href: '/dashboard', icon: MessageSquare },
    { name: 'Carolina Workspace', href: '/melly', icon: Cpu, hidden: !isOwner },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ].filter(item => !item.hidden);

  const renderContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-64 max-w-[85vw]">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <Link 
          href="/dashboard" 
          onClick={() => { if (isMobile) setMobileOpen(false); }}
          className="flex items-center gap-2 font-semibold text-lg tracking-tight"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
            C
          </div>
          Carolina
        </Link>
        {isMobile && (
          <button 
            id="close-sidebar-btn"
            aria-label="Close navigation"
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" 
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4">
        <Link 
          href="/dashboard"
          onClick={() => { if (isMobile) setMobileOpen(false); }}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl text-sm font-medium transition-all shadow-sm group"
        >
          <Plus className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          New Chat
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (isMobile) setMobileOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}

        <div className="px-3 pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          History
        </div>
        <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-500 italic">
          No previous conversations
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block h-screen fixed inset-y-0 left-0 z-40 w-64">
        {renderContent(false)}
      </aside>

      {/* Mobile Left Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
              aria-hidden="true"
            />
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden fixed inset-y-0 left-0 z-50 h-full w-64 max-w-[85vw] shadow-2xl flex flex-col"
            >
              {renderContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

