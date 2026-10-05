import React, { useState, useEffect } from 'react';
import { Database, AlertCircle } from 'lucide-react';
import { schemaAPI } from '../services/api';
import SchemaVisualizer from '../components/SchemaVisualizer';

export default function SchemaExplorer() {
  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchema = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await schemaAPI.getSchema(forceRefresh);
      setSchema(res.data);
    } catch (err) {
      setError('Failed to retrieve schema intelligence.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <Database className="w-3.5 h-3.5" />
          <span>Schema Intelligence Hub</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Relational Database Schema</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore relational tables, column data types, primary keys, and foreign key link graphs used by the AI Analyst.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <SchemaVisualizer
        schema={schema}
        onRefresh={() => fetchSchema(true)}
        isLoading={isLoading}
      />
    </div>
  );
}
