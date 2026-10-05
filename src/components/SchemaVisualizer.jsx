import React, { useState } from 'react';
import { Table, Key, Link2, Search, Layers, RefreshCw } from 'lucide-react';

export default function SchemaVisualizer({ schema, onRefresh, isLoading }) {
  const [search, setSearch] = useState('');

  if (!schema || !schema.tables) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>Loading schema structure...</p>
      </div>
    );
  }

  const filteredTables = schema.tables.filter((tbl) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tbl.name.toLowerCase().includes(q) ||
      tbl.columns.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tables or columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {schema.tables.length} Tables • {schema.relationships?.length || 0} Relationships
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Schema</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((tbl) => (
          <div
            key={tbl.name}
            className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg hover:border-slate-700 transition-all"
          >
            {/* Table Header */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-sm text-slate-100 uppercase tracking-wider">
                  {tbl.name}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {tbl.columns.length} cols
              </span>
            </div>

            {/* Columns Tree */}
            <div className="p-3 divide-y divide-slate-800/40 font-mono text-xs">
              {tbl.columns.map((col, idx) => {
                const isPk = col.primary_key;
                const isFk = tbl.foreign_keys?.some((fk) =>
                  fk.constrained_columns.includes(col.name)
                );

                return (
                  <div
                    key={col.name}
                    className="py-2 px-1 flex items-center justify-between hover:bg-slate-800/30 rounded px-1.5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 select-none">
                        {idx === tbl.columns.length - 1 ? '└──' : '├──'}
                      </span>

                      {isPk && <Key className="w-3 h-3 text-amber-400" title="Primary Key" />}
                      {isFk && <Link2 className="w-3 h-3 text-cyan-400" title="Foreign Key" />}

                      <span
                        className={`${
                          isPk
                            ? 'text-amber-300 font-semibold'
                            : isFk
                            ? 'text-cyan-300'
                            : 'text-slate-300'
                        }`}
                      >
                        {col.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-sans">{col.type}</span>
                      {isPk && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          PK
                        </span>
                      )}
                      {isFk && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          FK
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Relational Graph / Foreign Keys Section */}
      {schema.relationships && schema.relationships.length > 0 && (
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">Relational Schema Links (Foreign Keys)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {schema.relationships.map((rel, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-slate-300"
              >
                <div>
                  <span className="text-blue-400">{rel.from_table}</span>
                  <span className="text-slate-500">.{rel.from_column}</span>
                </div>
                <span className="text-purple-400 font-sans mx-2">→</span>
                <div>
                  <span className="text-emerald-400">{rel.to_table}</span>
                  <span className="text-slate-500">.{rel.to_column}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
