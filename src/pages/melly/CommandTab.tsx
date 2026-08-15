import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { apiFetch } from '../../lib/api';
import { Terminal, Play, AlertCircle } from 'lucide-react';

export default function CommandTab() {
  const { token } = useAuth();
  const [commands, setCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [output, setOutput] = useState<{status: string, reason?: string, exitCode?: number} | null>(null);

  useEffect(() => {
    apiFetch('/api/melly/commands', token)
      .then(r => r.json())
      .then(data => setCommands(data.commands || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const executeCommand = async (commandId: string) => {
    setExecuting(commandId);
    setOutput(null);
    try {
      const res = await apiFetch('/api/melly/commands/execute', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandId, params: {} })
      });
      const data = await res.json();
      setOutput(data);
    } catch (e: any) {
      setOutput({ status: 'ERROR', reason: e.message });
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl text-slate-100 font-bold uppercase tracking-widest">Termux Command Bus</h2>
        <p className="text-sm text-slate-500 mt-1">Execute approved automation scripts via the Termux Agent.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Command Registry</h3>
          {loading ? (
            <div className="text-slate-500 font-mono text-sm">Loading registry...</div>
          ) : commands.length === 0 ? (
            <div className="p-4 border border-dashed border-white/10 rounded-lg text-slate-500 text-sm">
              No commands registered. Add automation scripts to the registry to enable remote execution.
            </div>
          ) : (
            commands.map(cmd => (
              <div key={cmd.id} className="p-4 bg-black/40 border border-white/10 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-cyan-400 font-mono font-bold text-sm">{cmd.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{cmd.description}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] uppercase bg-white/5 text-slate-400 rounded">
                    Level: {cmd.permissionLevel}
                  </span>
                </div>
                <button 
                  onClick={() => executeCommand(cmd.id)}
                  disabled={executing !== null}
                  className="p-2 bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded transition-colors disabled:opacity-50"
                  title="Execute"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Execution Output</h3>
          <div className="h-64 bg-black border border-white/10 rounded-lg p-4 font-mono text-sm overflow-y-auto">
            {executing ? (
              <div className="text-cyan-500 animate-pulse flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Dispatching to Termux Agent...
              </div>
            ) : output ? (
              <div className={`space-y-2 ${output.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4" /> STATUS: {output.status}
                </div>
                {output.reason && <div>REASON: {output.reason}</div>}
                {output.exitCode !== undefined && <div>EXIT CODE: {output.exitCode}</div>}
              </div>
            ) : (
              <div className="text-slate-600">Waiting for execution...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
