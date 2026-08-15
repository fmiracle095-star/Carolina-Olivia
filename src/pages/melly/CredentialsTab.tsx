import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { apiFetch } from '../../lib/api';
import { Key, Lock, Save, Loader2 } from 'lucide-react';

export default function CredentialsTab() {
  const { token } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [rawKey, setRawKey] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        apiFetch('/api/melly/providers', token).then(r => r.json()),
        apiFetch('/api/melly/credentials', token).then(r => r.json())
      ]);
      setProviders(pRes.providers || []);
      setCredentials(cRes.credentials || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !rawKey) return;
    setSaving(true);
    try {
      await apiFetch('/api/melly/credentials', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: selectedProvider, rawKey })
      });
      setRawKey('');
      setSelectedProvider('');
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl text-slate-100 font-bold uppercase tracking-widest">Security & Credentials</h2>
        <p className="text-sm text-slate-500 mt-1">Credentials are encrypted at rest using AES-256-GCM.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Add / Update Credential</h3>
          <form onSubmit={handleSave} className="space-y-4 bg-black/40 border border-white/10 p-5 rounded-lg">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2 font-mono">Provider</label>
              <select 
                required
                value={selectedProvider}
                onChange={e => setSelectedProvider(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">Select Provider...</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2 font-mono">Secret Key</label>
              <input 
                type="password"
                required
                value={rawKey}
                onChange={e => setRawKey(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                placeholder="sk-..."
              />
            </div>
            <button 
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Encrypted Key</>}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Configured Vault</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-slate-500 font-mono text-sm">Accessing vault...</div>
            ) : credentials.length === 0 ? (
              <div className="text-slate-500 text-sm">No credentials stored.</div>
            ) : (
              credentials.map(c => {
                const p = providers.find(prov => prov.id === c.providerId);
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-300 text-sm">{p?.name || 'Unknown Provider'}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-xs">{c.masked}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
