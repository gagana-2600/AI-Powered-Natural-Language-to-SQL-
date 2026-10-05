import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Table, BarChart3, LineChart as LineIcon, PieChart as PieIcon, Sparkles } from 'lucide-react';
import ResultTable from './ResultTable';

const PALETTE = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#a855f7'
];

export default function Visualizer({ columns = [], rows = [], executionTimeMs = 0 }) {
  // Infer data types and structure
  const analysis = useMemo(() => {
    if (!rows || rows.length === 0 || !columns || columns.length === 0) {
      return { type: 'table', labelCol: '', valueCols: [] };
    }

    const firstRow = rows[0];
    const numericCols = [];
    const textCols = [];
    const dateCols = [];

    columns.forEach((col) => {
      const val = firstRow[col];
      const isNum = typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
      const isDate =
        col.toLowerCase().includes('date') ||
        col.toLowerCase().includes('month') ||
        col.toLowerCase().includes('year') ||
        (typeof val === 'string' && /^\d{4}-\d{2}/.test(val));

      if (isDate) {
        dateCols.push(col);
      } else if (isNum && !col.toLowerCase().endsWith('_id')) {
        numericCols.push(col);
      } else {
        textCols.push(col);
      }
    });

    // Determine auto recommendation
    if (rows.length === 1 && numericCols.length > 0 && textCols.length === 0 && dateCols.length === 0) {
      return { type: 'kpi', numericCols };
    }

    if (dateCols.length > 0 && numericCols.length > 0) {
      return {
        type: 'line',
        labelCol: dateCols[0],
        valueCols: numericCols,
      };
    }

    if (textCols.length > 0 && numericCols.length > 0) {
      if (rows.length <= 7 && numericCols.length === 1) {
        return {
          type: 'pie',
          labelCol: textCols[0],
          valueCols: numericCols,
        };
      }
      return {
        type: 'bar',
        labelCol: textCols[0],
        valueCols: numericCols,
      };
    }

    // Default fallback
    if (numericCols.length > 0) {
      return {
        type: 'bar',
        labelCol: columns[0],
        valueCols: numericCols,
      };
    }

    return { type: 'table', labelCol: '', valueCols: [] };
  }, [columns, rows]);

  const [activeTab, setActiveTab] = useState(analysis.type === 'kpi' ? 'table' : analysis.type);

  // Parse chart data to guarantee numeric types for Recharts
  const chartData = useMemo(() => {
    return rows.map((r) => {
      const entry = { ...r };
      analysis.valueCols?.forEach((vc) => {
        entry[vc] = parseFloat(r[vc]) || 0;
      });
      return entry;
    });
  }, [rows, analysis]);

  return (
    <div className="space-y-4">
      {/* Visualizer Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'table'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>

          <button
            onClick={() => setActiveTab('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'bar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('line')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'line'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Line Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('pie')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pie'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Pie Chart</span>
          </button>
        </div>

        {analysis.type !== 'table' && (
          <div className="flex items-center gap-1 text-[11px] text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Auto-detected best fit: {analysis.type.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* KPI Display if 1 row summary */}
      {analysis.type === 'kpi' && activeTab === 'table' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          {analysis.numericCols.map((col, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-md"
            >
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{col.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-bold text-blue-400">
                {typeof rows[0][col] === 'number'
                  ? rows[0][col].toLocaleString()
                  : rows[0][col]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Views */}
      {activeTab === 'table' && (
        <ResultTable columns={columns} rows={rows} executionTimeMs={executionTimeMs} />
      )}

      {activeTab === 'bar' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 h-96 shadow-lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey={analysis.labelCol || columns[0]}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              {(analysis.valueCols?.length ? analysis.valueCols : [columns[1]]).map((vc, idx) => (
                <Bar key={vc} dataKey={vc} fill={PALETTE[idx % PALETTE.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'line' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 h-96 shadow-lg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey={analysis.labelCol || columns[0]}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                angle={-25}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              {(analysis.valueCols?.length ? analysis.valueCols : [columns[1]]).map((vc, idx) => (
                <Line
                  key={vc}
                  type="monotone"
                  dataKey={vc}
                  stroke={PALETTE[idx % PALETTE.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: PALETTE[idx % PALETTE.length] }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'pie' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 h-96 shadow-lg">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Pie
                data={chartData}
                dataKey={analysis.valueCols?.[0] || columns[1]}
                nameKey={analysis.labelCol || columns[0]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
