import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { apiFetch } from '../../lib/api';
import { Server, Plus, Power, CheckCircle2, XCircle } from 'lucide-react';

export default function ConnectTab() {
  const { token } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    try {
      const res = await apiFetch('/api/melly/providers', token);
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const toggleProvider = async (id: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/api/melly/providers/${id}/toggle`, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      fetchProviders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h2 className="text-xl text-slate-100 font-bold uppercase tracking-widest">Carolina Connect</h2>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded transition-colors">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-slate-500 font-mono text-sm">Scanning provider registry...</div>
        ) : providers.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-white/10 rounded-lg text-slate-500">
            <Server className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No providers configured.
          </div>
        ) : (
          providers.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-lg">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg text-slate-200 font-medium">{p.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 rounded text-slate-400">
                    {p.type}
                  </span>
                </div>
                <div className="text-sm text-slate-500 font-mono">
                  Priority: {p.priority} | Endpoint: {p.endpoint || 'N/A'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {p.enabled ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                  <span className={`text-xs uppercase font-bold ${p.enabled ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {p.enabled ? 'Active' : 'Offline'}
                  </span>
                </div>
                <button 
                  onClick={() => toggleProvider(p.id, p.enabled)}
                  className={`p-2 rounded transition-colors ${p.enabled ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
