import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { analyticsAPI } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsAPI.getAnalytics();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading || !data) {
    return <div className="p-12 text-center text-slate-400">Computing analytics metrics...</div>;
  }

  const kpis = [
    { label: 'Total Queries Run', val: data.total_queries, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Success Rate', val: `${data.success_rate}%`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Avg Latency', val: `${data.average_execution_time_ms} ms`, icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Self-Repaired Queries', val: data.corrected_queries, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Platform Intelligence</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Analytics & Performance Metrics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time metrics on natural language query volume, execution latencies, table frequency, and autonomous error recovery.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-100">{kpi.val}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequently Queried Tables */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Most Frequently Queried Tables</h3>
          </div>
          <div className="h-64">
            {data.popular_tables?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.popular_tables} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="table" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="query_count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Queries" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No table queries recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Queries Per Day Activity */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">Query Volume Timeline</h3>
          </div>
          <div className="h-64">
            {data.queries_per_day?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.queries_per_day} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="queries" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Total Queries" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No timeline records yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
