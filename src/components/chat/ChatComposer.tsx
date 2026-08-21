import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';

export function ChatComposer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="absolute bottom-0 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 dark:to-transparent pt-6 pb-4 px-4 lg:px-8 z-10">
      <div className="max-w-3xl mx-auto">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-end bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all"
        >
          <button 
            type="button"
            className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Carolina-Olivia..."
            className="flex-1 max-h-48 min-h-[56px] py-4 bg-transparent border-none resize-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
            rows={1}
          />

          <button 
            type="submit"
            disabled={!text.trim()}
            className="p-3 m-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-center mt-2 text-xs text-slate-500">
          Carolina-Olivia can make mistakes. Consider verifying important information.
        </div>
      </div>
    </div>
  );
}
