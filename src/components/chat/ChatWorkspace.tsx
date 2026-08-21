import React, { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatComposer } from './ChatComposer';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/lib/AuthContext';
import { apiFetch } from '@/src/lib/api';

export function ChatWorkspace() {
  const [messages, setMessages] = useState<{ id: string, text: string, sender: 'user' | 'assistant' }[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('Analyzing...');
  const { session, isOwner, diagnostic } = useAuth();

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), text, sender: 'user' as const };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setLoading(true);
    setProcessingStatus('Analyzing...');

    const timer1 = setTimeout(() => setProcessingStatus('Planning...'), 300);
    const timer2 = setTimeout(() => setProcessingStatus('Selecting the best available model...'), 600);
    const timer3 = setTimeout(() => setProcessingStatus('Generating...'), 900);

    try {
      if (session?.access_token) {
        const payloadMessages = currentMessages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

        const res = await apiFetch('/api/v1/ai/generate', session.access_token, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: payloadMessages,
            routingPolicy: 'balanced',
          }),
        });

        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);

        if (res.ok) {
          const data = await res.json();
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: data.text || 'Received empty response from AI router.',
              sender: 'assistant',
            }
          ]);
        } else {
          const errorData = await res.json().catch(() => ({}));
          const errMsg = errorData.error || `Carolina AI Router status: ${res.status}`;
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: `[System]: ${errMsg}`,
              sender: 'assistant',
            }
          ]);
        }
      } else {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: 'Please log in to chat with Carolina.',
            sender: 'assistant',
          }
        ]);
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: `[Connection Notice]: ${err?.message || 'Unable to connect to Gateway AI Router.'}`,
          sender: 'assistant',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-950">
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto pt-14 pb-32 px-4 lg:px-8">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full justify-end py-6 space-y-6">
          
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center my-12">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-500/20">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">How can I help you today?</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                I am your Carolina-Olivia operations assistant.
              </p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
                  msg.sender === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tr-sm' 
                    : 'bg-transparent text-slate-900 dark:text-slate-100'
                }`}>
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                        C
                      </div>
                      <span className="text-sm font-medium">Carolina</span>
                    </div>
                  )}
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>{processingStatus}</span>
              </div>
            </div>
          )}
          
          {diagnostic && messages.length === 0 && (
            <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-xs text-slate-600 dark:text-slate-400 w-full">
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                System Diagnostic
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div><span className="font-medium">Gateway:</span> {diagnostic.gatewayUrl}</div>
                  <div><span className="font-medium">User ID:</span> {diagnostic.userId}</div>
                  <div><span className="font-medium">Status:</span> {diagnostic.httpStatus}</div>
                  <div><span className="font-medium">Owner Eval:</span> {isOwner ? 'YES' : 'NO'}</div>
                </div>
                <div>
                  <span className="font-medium">Raw Response:</span>
                  <pre className="mt-1 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded overflow-x-auto">
                    {diagnostic.rawResponse}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <ChatComposer onSend={handleSend} />
    </div>
  );
}
