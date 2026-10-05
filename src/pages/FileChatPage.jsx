import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  Send,
  Trash2,
  RefreshCw,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  ChevronRight,
  Database,
  Table as TableIcon,
  HelpCircle,
  AlertCircle,
  FileCheck,
  Search,
  Maximize2,
  BarChart2
} from 'lucide-react';
import { filesAPI } from '../services/api';

const SAMPLE_DEMO_CSV = `product_id,product_name,category,unit_price,units_sold,quarter,region
101,Ultra Wireless Headphones,Electronics,149.99,1420,Q1,North America
102,Ergonomic Mechanical Keyboard,Electronics,119.50,980,Q1,Europe
103,4K Ultra-Wide Monitor,Electronics,429.00,640,Q2,North America
104,Organic Cold Brew Coffee 12pk,Groceries,34.00,3200,Q2,North America
105,Smart Fitness Tracker Watch,Fitness,89.99,1850,Q2,Asia Pacific
106,Premium Yoga Mat & Blocks,Fitness,45.00,1210,Q3,Europe
107,Stainless Insulated Flask,Lifestyle,28.50,2150,Q3,North America
108,Noise-Canceling Earbuds Pro,Electronics,199.99,1120,Q3,Asia Pacific
109,Gourmet Espresso Beans 2lb,Groceries,24.99,2900,Q4,Europe
110,Standing Desk Converter,Furniture,249.00,530,Q4,North America`;

export default function FileChatPage() {
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeFileDetails, setActiveFileDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'preview'
  const [copiedId, setCopiedId] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [errorBanner, setErrorBanner] = useState(null);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Load files list on mount
  useEffect(() => {
    loadFiles();
  }, []);

  // When activeFileId changes, fetch details and chat messages
  useEffect(() => {
    if (activeFileId) {
      loadFileDetails(activeFileId);
      loadMessages(activeFileId);
    } else {
      setActiveFileDetails(null);
      setMessages([]);
    }
  }, [activeFileId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, activeTab]);

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await filesAPI.list();
      setFiles(res.data);
      if (res.data.length > 0 && !activeFileId) {
        setActiveFileId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const loadFileDetails = async (id) => {
    try {
      const res = await filesAPI.get(id);
      setActiveFileDetails(res.data);
    } catch (err) {
      console.error('Failed to load file details:', err);
    }
  };

  const loadMessages = async (id) => {
    try {
      const res = await filesAPI.getMessages(id);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsUploading(true);
    setErrorBanner(null);

    try {
      const res = await filesAPI.upload(uploadedFile);
      const newFile = res.data;
      setFiles((prev) => [newFile, ...prev]);
      setActiveFileId(newFile.id);
      setActiveTab('chat');
    } catch (err) {
      setErrorBanner(
        err.response?.data?.detail || 'Failed to parse and upload file. Please verify the format.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSampleData = async () => {
    setIsUploading(true);
    setErrorBanner(null);
    try {
      const blob = new Blob([SAMPLE_DEMO_CSV], { type: 'text/csv' });
      const sampleFile = new File([blob], 'quarterly_sales_report.csv', { type: 'text/csv' });
      const res = await filesAPI.upload(sampleFile);
      setFiles((prev) => [res.data, ...prev]);
      setActiveFileId(res.data.id);
      setActiveTab('chat');
    } catch (err) {
      setErrorBanner('Failed to load demo dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (textToSend = inputMessage) => {
    const text = textToSend.trim();
    if (!text || !activeFileId || isSending) return;

    // Optimistic user message
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await filesAPI.chat(activeFileId, text);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `⚠️ **Error**: ${err.response?.data?.detail || 'Failed to process question. Please try again.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteFile = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this file and all its conversation history?')) return;

    try {
      await filesAPI.delete(id);
      const remaining = files.filter((f) => f.id !== id);
      setFiles(remaining);
      if (activeFileId === id) {
        setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!activeFileId) return;
    try {
      await filesAPI.clearMessages(activeFileId);
      loadMessages(activeFileId);
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  };

  const handleCopyContent = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFormatBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'csv') return { label: 'CSV', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    if (t === 'xlsx' || t === 'xls') return { label: 'XLSX', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
    if (t === 'pdf') return { label: 'PDF', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    if (t === 'json') return { label: 'JSON', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    if (t === 'sql') return { label: 'SQL', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    return { label: t.toUpperCase() || 'TXT', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FileSpreadsheet className="w-4 h-4 text-white" />
            </div>
            Document & File AI Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload CSV, Excel, PDF, JSON, or text files to converse, query, calculate metrics, and extract insights.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleLoadSampleData}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 transition-all shadow-sm hover:text-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Try Sample Sales CSV
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.xls,.pdf,.json,.txt,.sql,.md"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {isUploading ? 'Parsing & Indexing...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-rose-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      {files.length === 0 && !isLoadingFiles ? (
        /* Empty State */
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-cyan-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100 mb-1">No files uploaded yet</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Upload any CSV, Excel spreadsheet, PDF document, or JSON file to start asking questions, calculating averages, and extracting insights.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Select File from Computer
            </button>
            <button
              onClick={handleLoadSampleData}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Load Sample Dataset
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">CSV</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">Excel (.xlsx)</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">PDF</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">JSON</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">Text & SQL</span>
          </div>
        </div>
      ) : (
        /* Two Column Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
          {/* Left Column: Files Navigator (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {/* Search & Header */}
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Files ({files.length})
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  + Add File
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter uploaded files..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Files List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
              {filteredFiles.map((file) => {
                const badge = getFormatBadge(file.file_type);
                const isActive = file.id === activeFileId;
                return (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`group p-3 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                      isActive
                        ? 'bg-blue-600/15 border border-blue-500/30 text-white shadow-sm'
                        : 'hover:bg-slate-800/40 border border-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold truncate group-hover:text-white transition-colors">
                          {file.filename}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatFileSize(file.file_size)}</span>
                          {file.row_count > 0 && <span>• {file.row_count} rows/pages</span>}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteFile(e, file.id)}
                      title="Delete File"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick stats footer */}
            {activeFileDetails && (
              <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active: <strong className="text-slate-200">{activeFileDetails.filename}</strong></span>
                <span className="text-cyan-400 font-medium">{activeFileDetails.columns?.length || 0} fields</span>
              </div>
            )}
          </div>

          {/* Right Column: Chat & Preview Area (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {/* Workspace Navigation Bar */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  Text with File (AI Chat)
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'preview'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Data & Schema Preview
                </button>
              </div>

              {activeTab === 'chat' && (
                <button
                  onClick={handleClearHistory}
                  title="Clear chat messages"
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Chat
                </button>
              )}
            </div>

            {/* Tab 1: Chat View */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-[540px]">
                {/* Message Conversation Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[560px]">
                  {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isUser
                              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isUser
                              ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-500/10'
                              : 'bg-slate-800/90 text-slate-200 rounded-tl-sm border border-slate-700/60 shadow-sm'
                          }`}
                        >
                          <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                            {msg.content}
                          </div>

                          {!isUser && (
                            <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                              <span>Source: {activeFileDetails?.filename || 'File'}</span>
                              <button
                                onClick={() => handleCopyContent(msg.content, msg.id || idx)}
                                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                              >
                                {copiedId === (msg.id || idx) ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isSending && (
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700/60 text-xs text-cyan-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        Analyzing file data & calculating answers...
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Dynamic Suggestion Chips */}
                {activeFileDetails?.suggestions?.length > 0 && (
                  <div className="px-5 py-2 border-t border-slate-800/60 bg-slate-950/30">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-cyan-400" /> Suggested Prompts
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFileDetails.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(sug)}
                          disabled={isSending}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-all text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={
                        activeFileDetails
                          ? `Ask anything about ${activeFileDetails.filename} (e.g. "Calculate average price", "Summarize trends")...`
                          : 'Select or upload a file first...'
                      }
                      disabled={!activeFileId || isSending}
                      className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50"
                    />

                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || !activeFileId || isSending}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab 2: Data & Schema Preview */}
            {activeTab === 'preview' && (
              <div className="flex-1 p-5 overflow-y-auto max-h-[640px] space-y-6">
                {activeFileDetails ? (
                  <>
                    {/* File Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-[11px] text-slate-400">Total Rows / Pages</span>
                        <p className="text-base font-bold text-white mt-0.5">
                          {activeFileDetails.row_count || 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-[11px] text-slate-400">Columns Detected</span>
                        <p className="text-base font-bold text-cyan-400 mt-0.5">
                          {activeFileDetails.column_count || activeFileDetails.columns?.length || '1'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-[11px] text-slate-400">File Type</span>
                        <p className="text-base font-bold text-emerald-400 mt-0.5 uppercase">
                          {activeFileDetails.file_type}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-[11px] text-slate-400">File Size</span>
                        <p className="text-base font-bold text-slate-200 mt-0.5">
                          {formatFileSize(activeFileDetails.file_size)}
                        </p>
                      </div>
                    </div>

                    {/* Columns Metadata Chips */}
                    {activeFileDetails.columns?.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Detected Schema & Fields
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {activeFileDetails.columns.map((c, i) => (
                            <div
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs flex items-center gap-1.5"
                            >
                              <span className="font-semibold text-slate-200">{c.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300">
                                {c.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tabular Preview Grid */}
                    {activeFileDetails.preview_data?.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Extracted Sample Data (First {activeFileDetails.preview_data.length} records)
                          </h3>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                                <th className="p-2.5 font-semibold text-slate-400">#</th>
                                {Object.keys(activeFileDetails.preview_data[0]).map((k) => (
                                  <th key={k} className="p-2.5 font-semibold text-slate-300 whitespace-nowrap">
                                    {k}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-slate-300">
                              {activeFileDetails.preview_data.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                  {Object.values(row).map((val, cellIdx) => (
                                    <td key={cellIdx} className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                                      {String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 whitespace-pre-wrap">
                        {activeFileDetails.summary || 'No tabular preview available for this document type.'}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Select a file on the left to preview its schema and data rows.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
