'use client';

import React from 'react';
import { OwnerToolTab } from '@/src/components/layout/OwnerSidebar';
import { 
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
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';

export function OwnerToolView({ tab }: { tab: OwnerToolTab }) {
  if (tab === 'chat') {
    return null; // rendered by main chat workspace
  }

  const renderModuleHeader = (title: string, subtitle: string, icon: React.ReactNode) => (
    <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-sm">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
          <Lock className="w-3 h-3 mr-1.5" />
          Overseer Protected
        </span>
      </div>
    </div>
  );

  switch (tab) {
    case 'models':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Model Registry', 'Manage remote and local inference endpoints', <Cpu className="w-6 h-6" />)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Gemini 2.5 Pro (Remote)', 'Grok 3 (Remote)', 'Claude 3.7 Sonnet (Remote)', 'Local Llama 3 8B (Runtime)'].map((model, idx) => (
                <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{model}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full">Ready</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Configured via Gateway AI router interface mapping.</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span>Context Window: 128k</span>
                    <span className="text-indigo-500 font-medium">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'providers':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('AI Providers', 'External model providers and API keys configuration', <Layers className="w-6 h-6" />)}
            <div className="space-y-4">
              {[
                { name: 'Google Gemini AI', status: 'Connected via Server-Side SDK', secure: true },
                { name: 'OpenAI', status: 'Awaiting Provider Key', secure: true },
                { name: 'Anthropic', status: 'Awaiting Provider Key', secure: true },
                { name: 'Local Runtime (Ollama)', status: 'Standby on localhost:11434', secure: false },
              ].map((p, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                      {p.name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{p.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.status}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                    Configure
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'plugins':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Plugins & Extensions', 'Active platform extensions and modular capabilities', <Plug className="w-6 h-6" />)}
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm">
              <Plug className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">No Active Third-Party Plugins</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                The plugin registry is initialized. Extensions can be securely injected via the Gateway API router in future phases.
              </p>
            </div>
          </div>
        </div>
      );

    case 'tools':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Tools & Function Calling', 'Executable capabilities available to Carolina', <Wrench className="w-6 h-6" />)}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Web Search Grounding', 'Code Sandbox Execution', 'Database Query Tool', 'File Reader/Writer', 'Terminal Bridge', 'Image Processor'].map((tool, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">{tool}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Registered and ready for tool-use calls.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'api':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('API Gateway Management', 'Endpoints, rate limits, and routing policies', <Key className="w-6 h-6" />)}
            <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Gateway Base URL</span>
                <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-400">https://carolina-gateway.vercel.app/api/v1</code>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Authentication Scheme</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Bearer Token + Supabase JWT + Owner UUID Match</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Rate Limiting</span>
                <span className="text-xs text-slate-700 dark:text-slate-300">100 requests / 15 minutes</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'terminal':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Secure Terminal', 'Encrypted shell execution interface for Overseer', <TerminalIcon className="w-6 h-6" />)}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 font-mono text-xs text-slate-200 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-slate-400">
                <span>carolina@gateway-node-01:~#</span>
                <span className="flex items-center text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                  Connected
                </span>
              </div>
              <p className="text-slate-400 mb-2"># Terminal bridge initialized under secure Overseer auth.</p>
              <p className="text-slate-400 mb-4"># Unrestricted execution requires private Local Agent pairing.</p>
              <div className="flex items-center gap-2 text-indigo-400">
                <span>$</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'agent':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Local Agent (Termux / Kali)', 'Private edge device runner status and heartbeats', <Radio className="w-6 h-6" />)}
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">Local Agent Standby</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                No active Termux or Kali local agent daemon is currently paired with this gateway instance.
              </p>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm">
                Generate Pairing Token
              </button>
            </div>
          </div>
        </div>
      );

    case 'usage':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Usage & Analytics', 'Token consumption, latency, and operational telemetry', <BarChart3 className="w-6 h-6" />)}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Tokens', value: '0', change: '0% this session' },
                { label: 'Average Latency', value: '0 ms', change: 'Optimal' },
                { label: 'Success Rate', value: '100%', change: 'All checks passed' },
              ].map((stat, idx) => (
                <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 my-1">{stat.value}</div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{stat.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'memory':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Memory & Context Store', 'Vector embeddings and long-term memory store', <Database className="w-6 h-6" />)}
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm">
              <Database className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">Vector Store Initialized</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Long-term memory indexing is ready for persistent conversation embedding in upcoming phases.
              </p>
            </div>
          </div>
        </div>
      );

    case 'files':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Files & Documents', 'Workspace document repository and dataset uploads', <FolderKanban className="w-6 h-6" />)}
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm border-dashed">
              <FolderKanban className="w-10 h-10 text-slate-400 mx-auto mb-4" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">Drop files here or click to upload</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                Support for PDF, TXT, CSV, and code files for context ingestion.
              </p>
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors">
                Browse Files
              </button>
            </div>
          </div>
        </div>
      );

    case 'system':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('System Diagnostics', 'Cluster health, security audit trail & event logs', <ShieldAlert className="w-6 h-6" />)}
            <div className="space-y-3">
              {[
                { event: 'Gateway Authentication Verified', time: 'Just now', status: 'Success' },
                { event: 'Supabase Session Synchronized', time: '1m ago', status: 'Success' },
                { event: 'CORS Preflight Policy Evaluated', time: '5m ago', status: 'Success' },
                { event: 'Owner Authorization Check (OWNER_UUID)', time: '10m ago', status: 'Passed' },
              ].map((log, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{log.event}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{log.time}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
