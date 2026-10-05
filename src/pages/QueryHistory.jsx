import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Play, Trash2, Clock, CheckCircle, Wrench, AlertCircle, Search } from 'lucide-react';
import { queryAPI } from '../services/api';

export default function QueryHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await queryAPI.getHistory();
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      await queryAPI.deleteHistory(id);
      setHistory(history.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Failed to delete history item', err);
    }
  };

  const filtered = history.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      h.natural_language_question.toLowerCase().includes(q) ||
      h.generated_sql.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail & Query Log</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Query History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review previous natural language analyses, inspect generated SQL, and rerun queries.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search query history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading history logs...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800">
          <p className="text-sm text-slate-400">No query history records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all shadow-md space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  {item.execution_status === 'SUCCESS' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      SUCCESS
                    </span>
                  )}
                  {item.execution_status === 'CORRECTED' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Wrench className="w-3 h-3" />
                      CORRECTED
                    </span>
                  )}
                  {item.execution_status === 'FAILED' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      <AlertCircle className="w-3 h-3" />
                      FAILED
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-slate-200">
                    {item.natural_language_question}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigate('/', { state: { question: item.natural_language_question } });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Again</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/15 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SQL Snippet */}
              <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-blue-300 overflow-x-auto border border-slate-900">
                <code>{item.corrected_sql || item.generated_sql}</code>
              </div>

              {/* Metadata Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.execution_time_ms} ms
                  </span>
                  <span>{item.row_count} rows returned</span>
                </div>
                <span>{item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
