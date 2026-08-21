'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Providers } from "@/src/components/Providers";
import { AppShell } from "@/src/components/layout/AppShell";
import { OwnerSidebar, OwnerToolTab } from "@/src/components/layout/OwnerSidebar";
import { OwnerToolView } from "@/src/components/owner/OwnerToolView";
import { useAuth } from '@/src/lib/AuthContext';
import { useRouter } from 'next/navigation';
import NotFound from '@/src/app/not-found';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Activity, Send, Paperclip, Sparkles, ShieldCheck, Bot, User, AlertCircle, PanelRightOpen } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'carolina';
  timestamp: string;
}

function MellyContent() {
  const { isOwner, user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OwnerToolTab>('chat');
  const [rightMobileOpen, setRightMobileOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, activeTab]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isOwner) {
    return <NotFound />;
  }

  const handleSend = (textToSend?: string) => {
    const content = textToSend || inputText;
    if (!content.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: content.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const carolinaMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `Greetings, Overseer. Carolina neural core is active and authenticated with verified owner privileges (${user.id.substring(0, 8)}...). The live AI provider backend is currently awaiting API key provisioning in the environment settings. Once configured, full neural generation and model routing will engage automatically.`,
        sender: 'carolina',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, carolinaMsg]);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* Center Main Workspace (Chat or Owner Tool View) */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden lg:pr-72">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {activeTab === 'chat' ? 'Owner / Overseer Panel (Carolina)' : `Owner Tools • ${activeTab.toUpperCase()}`}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                  Secure Channel
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Overseer Exclusive Access • Gateway Verified</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Owner Verified</span>
            </div>

            {/* Mobile Owner Tools Toggle */}
            <button
              onClick={() => setRightMobileOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl"
              title="Open Owner Tools"
            >
              <PanelRightOpen className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Chat or Tool View */}
        {activeTab !== 'chat' ? (
          <OwnerToolView tab={activeTab} />
        ) : (
          <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 pb-32">
              <div className="max-w-3xl mx-auto flex flex-col space-y-6">
                
                {/* Provider Notice Banner */}
                <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-5 flex items-start gap-4">
                  <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Carolina AI Platform Foundation (Phase 1)</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      You are logged in as the verified Overseer. The Owner Panel and two-sidebar architecture are fully operational. Provider bindings and AI router protocols are awaiting API key provisioning.
                    </p>
                  </div>
                </div>

                {/* Empty State */}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center text-center my-16 py-12 px-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 text-indigo-500">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">How can Carolina assist you today?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
                      Ask questions regarding gateway routing, security audit logs, model registries, or system diagnostics.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                      <button 
                        onClick={() => handleSend("Run diagnostic check on gateway and authentication status")}
                        className="p-3 text-left text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <span className="font-semibold block mb-1">Gateway Diagnostics</span>
                        Check token validation and system status
                      </button>
                      <button 
                        onClick={() => handleSend("Verify overseer permissions and security policy")}
                        className="p-3 text-left text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <span className="font-semibold block mb-1">Security Policy</span>
                        Inspect owner role and authorization rules
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'carolina' && (
                        <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between gap-4 mb-1.5 text-xs opacity-75">
                          <span className="font-medium">{msg.sender === 'user' ? 'Overseer' : 'Carolina'}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 shadow-sm mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 items-center"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Composer Footer */}
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:to-transparent pt-6 pb-6 px-4 lg:px-8 z-10">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <button 
                    type="button"
                    className="p-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title="Attach context"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Carolina..."
                    className="flex-1 max-h-48 min-h-[54px] py-4 bg-transparent border-none resize-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                    rows={1}
                  />

                  <button 
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!inputText.trim()}
                    className="p-3 m-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Secure Overseer Channel • End-to-End Verified
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Owner Sidebar (Desktop) */}
      <OwnerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Right Owner Sidebar Mobile Drawer */}
      <AnimatePresence>
        {rightMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRightMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="lg:hidden fixed inset-y-0 right-0 z-50 shadow-2xl"
            >
              <OwnerSidebar activeTab={activeTab} setActiveTab={setActiveTab} mobileOpen={rightMobileOpen} setMobileOpen={setRightMobileOpen} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MellyWrapper() {
  return (
    <Providers>
      <AppShell>
        <MellyContent />
      </AppShell>
    </Providers>
  );
}
