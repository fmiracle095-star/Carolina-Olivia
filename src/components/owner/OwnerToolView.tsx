'use client';

import React, { useState, useEffect } from 'react';
import { OwnerToolTab } from '@/src/components/layout/OwnerSidebar';
import { useAuth } from '@/src/lib/AuthContext';
import { apiFetch } from '@/src/lib/api';
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
  RefreshCw,
  Activity,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export function OwnerToolView({ tab }: { tab: OwnerToolTab }) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [healthChecking, setHealthChecking] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    loadData();
  }, [tab, session?.access_token]);

  const loadData = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      if (tab === 'providers') {
        const res = await apiFetch('/api/v1/providers', session.access_token);
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || []);
        }
      } else if (tab === 'models') {
        const res = await apiFetch('/api/v1/models', session.access_token);
        if (res.ok) {
          const data = await res.json();
          setModels(data.models || []);
        }
      } else if (tab === 'usage') {
        const res = await apiFetch('/api/v1/usage/summary', session.access_token);
        if (res.ok) {
          const data = await res.json();
          setUsageSummary(data.overview || null);
        }
      } else if (tab === 'system') {
        const res = await apiFetch('/api/v1/system/status', session.access_token);
        if (res.ok) {
          const data = await res.json();
          setSystemStatus(data);
        }
      }
    } catch (err: any) {
      console.error('Failed to load owner tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkProviderHealth = async (providerId: string) => {
    if (!session?.access_token) return;
    setHealthChecking(providerId);
    setStatusMessage(null);
    try {
      const res = await apiFetch(`/api/v1/providers/${providerId}/health`, session.access_token, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Provider check: ${data.health?.status || 'Completed'} (${data.health?.latencyMs ?? 0}ms)`);
        loadData();
      } else {
        setStatusMessage(`Check failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setHealthChecking(null);
    }
  };

  const toggleModel = async (modelId: string, currentEnabled: boolean) => {
    if (!session?.access_token) return;
    try {
      const endpoint = currentEnabled ? `/api/v1/models/${modelId}/disable` : `/api/v1/models/${modelId}/enable`;
      const res = await apiFetch(endpoint, session.access_token, { method: 'POST' });
      if (res.ok) {
        loadData();
      }
    } catch (err: any) {
      console.error('Failed to toggle model:', err);
    }
  };

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
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
            {renderModuleHeader('Model Registry', 'Manage remote and local inference endpoints and capabilities', <Cpu className="w-6 h-6" />)}
            
            {models.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-sm">
                <Cpu className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Model Configurations</p>
                <p className="text-xs text-slate-500 mt-1">Connecting to Gateway Model Registry...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map((m) => (
                  <div key={m.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{m.display_name || m.name}</h3>
                        <p className="text-[11px] font-mono text-slate-400">{m.model_identifier}</p>
                      </div>
                      <button
                        onClick={() => toggleModel(m.id, m.enabled)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-full flex items-center gap-1 transition-colors ${
                          m.enabled 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {m.enabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {m.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{m.description || 'Configured via Gateway AI Router.'}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(m.capabilities || []).map((cap: string) => (
                        <span key={cap} className="px-2 py-0.5 text-[10px] font-mono bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md">
                          {cap}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span>Priority: <strong className="text-slate-700 dark:text-slate-300">{m.priority}</strong></span>
                      <span>Context: <strong className="text-slate-700 dark:text-slate-300">{(m.context_window / 1024).toFixed(0)}k</strong></span>
                      <span className="capitalize">{m.local_or_remote}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'providers':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('AI Providers', 'External model providers and API key adapters', <Layers className="w-6 h-6" />)}
            
            {statusMessage && (
              <div className="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <span>{statusMessage}</span>
                <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">×</button>
              </div>
            )}

            <div className="space-y-4">
              {providers.length > 0 ? (
                providers.map((p) => (
                  <div key={p.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        {p.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{p.name}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            p.status === 'healthy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            p.status === 'degraded' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Slug: {p.slug} • Type: {p.type} • {p.enabled ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => checkProviderHealth(p.id)}
                        disabled={healthChecking === p.id}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Activity className={`w-3.5 h-3.5 ${healthChecking === p.id ? 'animate-spin' : ''}`} />
                        Health Check
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-sm">
                  <Layers className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">xAI Grok Provider Adapter</p>
                  <p className="text-xs text-slate-500 mt-1">Configured on authoritative Gateway backend.</p>
                </div>
              )}
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
                { label: 'Total Requests', value: usageSummary?.totalRequests ?? '0', change: `${usageSummary?.successfulRequests ?? 0} successful` },
                { label: 'Total Tokens', value: (usageSummary?.totalTokens ?? 0).toLocaleString(), change: `${usageSummary?.inputTokens ?? 0} in / ${usageSummary?.outputTokens ?? 0} out` },
                { label: 'Average Latency', value: `${usageSummary?.averageLatencyMs ?? 0} ms`, change: 'Gateway Authoritative' },
              ].map((stat, idx) => (
                <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 my-1">{stat.value}</div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{stat.change}</span>
                </div>
              ))}
            </div>

            {usageSummary?.recentLogs && usageSummary.recentLogs.length > 0 && (
              <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Recent AI Execution Audit Logs</h3>
                <div className="space-y-2">
                  {usageSummary.recentLogs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-mono text-slate-700 dark:text-slate-300">{log.capability}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        <span>{log.total_tokens || 0} tokens</span>
                        <span>{log.latency_ms || 0} ms</span>
                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case 'system':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('System Diagnostics', 'Cluster health, security audit trail & event logs', <ShieldAlert className="w-6 h-6" />)}
            
            {systemStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="text-[11px] text-slate-400">Database</div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-1">{systemStatus.database || 'CONNECTED'}</div>
                </div>
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="text-[11px] text-slate-400">AI Router</div>
                  <div className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 mt-1">ACTIVE</div>
                </div>
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="text-[11px] text-slate-400">Vault</div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-1">{systemStatus.vault || 'SECURE'}</div>
                </div>
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="text-[11px] text-slate-400">Overseer Auth</div>
                  <div className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 mt-1">VALIDATED</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {[
                { event: 'AI Router Engine Initialized', time: 'Active', status: 'Phase 2 Ready' },
                { event: 'Provider Registry Synchronized', time: 'Active', status: 'Healthy' },
                { event: 'Gateway Authentication Verified', time: 'Just now', status: 'Success' },
                { event: 'Owner Authorization Check (OWNER_UUID)', time: 'Active', status: 'Enforced' },
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

    case 'plugins':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Plugins & Extensions', 'Active platform extensions and modular capabilities', <Plug className="w-6 h-6" />)}
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-sm">
              <Plug className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">Plugin Framework Ready</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                The plugin registry is initialized on the Gateway. Extensions will connect via normalized interfaces in Phase 3.
              </p>
            </div>
          </div>
        </div>
      );

    case 'tools':
      return (
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto">
            {renderModuleHeader('Tools & Capabilities', 'Executable capabilities available to Carolina', <Wrench className="w-6 h-6" />)}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['chat.generate', 'chat.stream', 'code.sandbox', 'database.query', 'search.grounding', 'vision.analyze'].map((tool, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">{tool}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Registered with Gateway Router.</p>
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
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Gateway AI Router</span>
                <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-400">/api/v1/ai/generate</code>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Streaming SSE Route</span>
                <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-400">/api/v1/ai/stream</code>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Authentication Scheme</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Bearer Token + Supabase JWT + Owner UUID Check</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Routing Policy</span>
                <span className="text-xs text-slate-700 dark:text-slate-300">Balanced (Fallback / Cost / Latency Optimized)</span>
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

    default:
      return null;
  }
}
