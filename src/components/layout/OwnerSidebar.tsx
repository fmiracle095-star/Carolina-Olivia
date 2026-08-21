'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Cpu, 
  Layers, 
  Plug, 
  Wrench, 
  Key, 
  Terminal as TerminalIcon, 
  Radio, 
  BarChart3, 
  Database, 
  FolderKanban, 
  ShieldAlert,
  Brain,
  X
} from 'lucide-react';

export type OwnerToolTab = 'chat' | 'intelligence' | 'models' | 'providers' | 'plugins' | 'tools' | 'api' | 'terminal' | 'agent' | 'usage' | 'memory' | 'files' | 'system';

interface OwnerSidebarProps {
  activeTab: OwnerToolTab;
  setActiveTab: (tab: OwnerToolTab) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const ownerToolsList = [
  { id: 'chat' as OwnerToolTab, name: 'Carolina Chat', icon: MessageSquare, description: 'Primary neural conversational workspace' },
  { id: 'intelligence' as OwnerToolTab, name: 'Intelligence Test', icon: Brain, description: 'Orchestration & classification test card' },
  { id: 'models' as OwnerToolTab, name: 'Models', icon: Cpu, description: 'Remote & local model registry' },
  { id: 'providers' as OwnerToolTab, name: 'Providers', icon: Layers, description: 'AI provider bindings (OpenAI, Google, etc.)' },
  { id: 'plugins' as OwnerToolTab, name: 'Plugins', icon: Plug, description: 'Active extensions and integrations' },
  { id: 'tools' as OwnerToolTab, name: 'Tools', icon: Wrench, description: 'Function calling and tool definitions' },
  { id: 'api' as OwnerToolTab, name: 'API', icon: Key, description: 'Gateway routing and endpoint keys' },
  { id: 'terminal' as OwnerToolTab, name: 'Terminal', icon: TerminalIcon, description: 'Secure remote execution bridge' },
  { id: 'agent' as OwnerToolTab, name: 'Local Agent', icon: Radio, description: 'Termux / Kali heartbeat & status' },
  { id: 'usage' as OwnerToolTab, name: 'Usage', icon: BarChart3, description: 'Token metrics and latency analytics' },
  { id: 'memory' as OwnerToolTab, name: 'Memory', icon: Database, description: 'Vector embeddings & context storage' },
  { id: 'files' as OwnerToolTab, name: 'Files', icon: FolderKanban, description: 'Document and dataset repository' },
  { id: 'system' as OwnerToolTab, name: 'System', icon: ShieldAlert, description: 'Cluster health & security audit logs' },
];

export function OwnerSidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }: OwnerSidebarProps) {
  const renderContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-72 max-w-[85vw]">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">Owner Tools</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Overseer Control Plane</p>
        </div>
        {isMobile && setMobileOpen && (
          <button 
            id="close-owner-sidebar-btn"
            aria-label="Close Owner Tools"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" 
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Architecture Modules
        </div>
        {ownerToolsList.map((tool) => {
          const isActive = activeTab === tool.id;
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTab(tool.id);
                if (setMobileOpen) setMobileOpen(false);
              }}
              className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-500/20 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-xs sm:text-sm">{tool.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-500 line-clamp-1">{tool.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Gateway Status</span>
          <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block h-screen fixed inset-y-0 right-0 z-40 w-72">
        {renderContent(false)}
      </aside>

      {/* Mobile Right Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="owner-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen?.(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
              aria-hidden="true"
            />
            <motion.aside
              key="owner-sidebar-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="lg:hidden fixed inset-y-0 right-0 z-50 h-full w-72 max-w-[85vw] shadow-2xl flex flex-col"
            >
              {renderContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

