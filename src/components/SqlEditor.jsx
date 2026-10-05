import React, { useState } from 'react';
import { Copy, Check, Terminal, Play, Edit3 } from 'lucide-react';

export default function SqlEditor({ sql, onChange, onExecute, isExecuting }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL', err);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-sm overflow-hidden shadow-xl">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
            Generated MySQL Query
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
            Read-Only Approved
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-md border transition-colors ${
              isEditing
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Editing' : 'Tweak SQL'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
        {isEditing ? (
          <textarea
            value={sql}
            onChange={(e) => onChange && onChange(e.target.value)}
            rows={5}
            className="w-full bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
          />
        ) : (
          <pre className="text-blue-300 whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
            {sql}
          </pre>
        )}
      </div>

      {/* Action Footer */}
      {onExecute && (
        <div className="px-4 py-2.5 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Click execute to fetch real-time records from database
          </span>
          <button
            onClick={onExecute}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Executing...' : 'Execute Query'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
