import React, { useState, useEffect } from 'react';
import { Settings, Cpu, Key, Database, CheckCircle, RefreshCw } from 'lucide-react';
import { queryAPI } from '../services/api';
import api from '../services/api';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    provider: 'fallback',
    model: 'gemini-1.5-flash',
    has_api_key: false,
    is_fallback: true
  });
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('fallback');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [baseUrl, setBaseUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    fetchConfig();
    checkDatabase();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await queryAPI.getConfig();
      setConfig(res.data);
      setProvider(res.data.provider);
      setModel(res.data.model);
    } catch (err) {
      console.error('Failed to get config', err);
    }
  };

  const checkDatabase = async () => {
    try {
      const res = await api.get('/health');
      setDbStatus(res.data);
    } catch (err) {
      setDbStatus({ status: 'error', database: 'Offline' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await queryAPI.updateConfig({
        provider,
        api_key: apiKey,
        model,
        base_url: baseUrl || null
      });
      setMessage({ type: 'success', text: 'AI Service configuration updated successfully!' });
      setConfig(res.data.config);
      setApiKey('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <Settings className="w-3.5 h-3.5" />
          <span>System Configuration</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">AI Model & Database Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure the active LLM provider (Google Gemini, OpenAI, Groq, local Ollama, or Schema Fallback) and monitor database connectivity.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Database Status Card */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Relational Database Engine</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Connected Engine:{' '}
                <span className="text-emerald-400 font-mono font-semibold uppercase">
                  {dbStatus?.database || 'Checking...'}
                </span>{' '}
                • Status:{' '}
                <span className="text-emerald-400 font-semibold">
                  {dbStatus?.status || 'Online'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={checkDatabase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verify Connection</span>
          </button>
        </div>
      </div>

      {/* AI Model Configuration Form */}
      <form onSubmit={handleSave} className="p-6 rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <Cpu className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-200">AI Text-to-SQL Provider</h3>
            <p className="text-xs text-slate-400">Select model service and provide API credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Provider Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              LLM Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="fallback">Intelligent Schema Fallback (Built-in / Offline)</option>
              <option value="gemini">Google Gemini (API Key required)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="groq">Groq (High-Speed Llama)</option>
              <option value="ollama">Local Ollama (localhost:11434)</option>
            </select>
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Model Identifier
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gemini-1.5-flash, gpt-4o-mini, llama-3.3-70b"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* API Key */}
        {provider !== 'fallback' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              API Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={config.has_api_key ? '•••••••••••••••• (API key configured)' : 'Paste your API key here'}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Keys are securely stored in memory and server environment variables.
            </p>
          </div>
        )}

        {/* Base URL (Optional for Groq / Ollama / Custom endpoints) */}
        {(provider === 'openai' || provider === 'groq' || provider === 'ollama') && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Custom Base URL (Optional)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="e.g. https://api.groq.com/openai/v1 or http://localhost:11434/v1"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
