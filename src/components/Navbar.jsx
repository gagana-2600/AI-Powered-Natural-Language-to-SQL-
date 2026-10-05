import React, { useState, useEffect } from 'react';
import { Database, Cpu, CheckCircle2, ExternalLink } from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const [health, setHealth] = useState({ database: 'Connecting...', status: 'loading' });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        setHealth({ database: 'Offline', status: 'error' });
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-200">AI Database Studio</h2>
        <span className="text-slate-600">/</span>
        <span className="text-xs text-slate-400">MySQL & SQLite Relational Engine</span>
      </div>

      <div className="flex items-center gap-3">
        {/* DB Status Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span className="capitalize">{health.database || 'Database'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        {/* AI Engine Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>LLM Engine: Ready</span>
        </div>

        {/* Docs Button */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
        >
          <span>Swagger API</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </header>
  );
}
