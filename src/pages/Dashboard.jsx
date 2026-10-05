import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Paperclip,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  Database,
  Terminal,
  BarChart3,
  Table as TableIcon,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ChevronRight,
  X,
  Bot,
  User,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { queryAPI, filesAPI } from '../services/api';
import SqlEditor from '../components/SqlEditor';
import Visualizer from '../components/Visualizer';

const DEFAULT_SUGGESTIONS = [
  "Show the top 5 customers by total spending.",
  "What is the total revenue for each month in 2025?",
  "Which product generated the highest revenue?",
  "Show the number of orders for each category.",
  "Which customers have placed more than 5 orders?",
  "What is the average order value?"
];

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

export default function Dashboard() {
  // Chat Conversation State
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Welcome! I am your **AI SQL & Data Analyst**.\n\n" +
        "You can:\n" +
        "1. **Generate & Execute SQL Queries**: Ask database questions in plain English (e.g. *\"Show top 5 customers by spending\"*).\n" +
        "2. **Upload & Chat with Files**: Attach CSV, Excel, PDF, JSON, or text files using the paperclip button below to chat, calculate metrics, and extract insights.\n\n" +
        "All visual charts, data tables, and generated SQL queries will appear in the **Output Window** on the right!",
      created_at: new Date().toISOString()
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(null);
  const [correctionAlert, setCorrectionAlert] = useState(null);

  // Attached File State
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileSuggestions, setFileSuggestions] = useState([]);

  // Output Window States
  const [outputTab, setOutputTab] = useState('results'); // 'results', 'sql', 'file'
  const [generatedSqlData, setGeneratedSqlData] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const fileInputRef = useRef(null);
  const chatMessagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle File Upload from within the chatting window
  const handleFileUpload = async (fileObj) => {
    if (!fileObj) return;

    setIsUploadingFile(true);
    try {
      const res = await filesAPI.upload(fileObj);
      const parsedFile = res.data;
      setAttachedFile(parsedFile);
      setFileSuggestions(parsedFile.suggestions || []);
      setOutputTab('file');

      // Add confirmation message to chat
      const uploadConfirmMsg = {
        id: Date.now(),
        role: 'assistant',
        content:
          `📁 **File Uploaded & Indexed:** \`${parsedFile.filename}\` (${parsedFile.file_type.toUpperCase()})\n\n` +
          `• **Records / Lines:** ${parsedFile.row_count}\n` +
          `• **Columns / Fields:** ${parsedFile.column_count}\n\n` +
          `${parsedFile.summary?.splitlines()[0] || ''}\n\n` +
          `You can now ask questions about this file (e.g. *\"Calculate average price\"*, *\"Summarize key trends\"*), or type a database question to generate SQL!`,
        fileInfo: parsedFile,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, uploadConfirmMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now(),
        role: 'assistant',
        content: `⚠️ **Upload Failed**: ${err.response?.data?.detail || 'Could not parse file.'}`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSampleCSV = () => {
    const blob = new Blob([SAMPLE_DEMO_CSV], { type: 'text/csv' });
    const sample = new File([blob], 'quarterly_sales_report.csv', { type: 'text/csv' });
    handleFileUpload(sample);
  };

  // Main Submit: handles both SQL generation and File Chat seamlessly
  const handleSubmit = async (userPrompt = inputQuestion) => {
    const queryText = userPrompt.trim();
    if (!queryText || isProcessing) return;

    // Append user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: queryText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsProcessing(true);
    setCorrectionAlert(null);

    // Decision: If attached file exists and question seems related to the file
    // or does not specifically mention sql/database table keywords, try file chat
    const lower = queryText.toLowerCase();
    const isExplicitSql =
      lower.startsWith('select ') ||
      lower.includes('sql') ||
      lower.includes('database') ||
      lower.includes('orders') ||
      lower.includes('customers') ||
      lower.includes('products table');

    if (attachedFile && !isExplicitSql) {
      // Chat with attached file
      try {
        const res = await filesAPI.chat(attachedFile.id, queryText);
        setMessages((prev) => [...prev, res.data]);
        setOutputTab('file');
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: `⚠️ **File Query Error**: ${err.response?.data?.detail || 'Failed to process question.'}`,
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Otherwise: Generate SQL Query & Auto-Execute against Database
    setPipelineStep('retrieving_schema');
    try {
      setTimeout(() => setPipelineStep('generating_sql'), 300);
      const genRes = await queryAPI.generate(queryText);
      setPipelineStep('validating_security');

      const generatedData = genRes.data;
      setGeneratedSqlData(generatedData);

      // Execute SQL against Database
      const execRes = await queryAPI.execute(generatedData.sql, queryText);

      let finalResult = execRes.data;
      let repairNotice = null;

      // Check if execution failed and trigger self-repair
      if (!finalResult.success) {
        setPipelineStep('repairing_sql');
        const correctRes = await queryAPI.correct(queryText, generatedData.sql, finalResult.error);
        if (correctRes.data?.corrected_sql) {
          generatedData.sql = correctRes.data.corrected_sql;
          repairNotice = correctRes.data.correction_explanation;
          setCorrectionAlert(repairNotice);
          if (correctRes.data.final_result) {
            finalResult = correctRes.data.final_result;
          }
        }
      }

      setExecutionResult(finalResult);
      setOutputTab('results');

      // Add Assistant Message to Chat
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content:
          `I analyzed your question and synthesized the following MySQL query:\n\n` +
          `\`\`\`sql\n${generatedData.sql}\n\`\`\`\n\n` +
          `**Explanation:** ${generatedData.explanation || 'Optimal read-only query retrieved.'}\n\n` +
          (repairNotice ? `*Self-Repair Note: ${repairNotice}*\n\n` : '') +
          `📊 **Results:** Returned **${finalResult?.row_count || 0} rows** in **${finalResult?.execution_time_ms || 0} ms**. Check the **Output Window** for visual charts and data tables!`,
        sql: generatedData.sql,
        relevantTables: generatedData.relevant_tables,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `⚠️ **SQL Generation Failed**: ${err.response?.data?.detail || 'An error occurred.'}`,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsProcessing(false);
      setPipelineStep(null);
    }
  };

  const handleManualSqlExecute = async (sqlToRun) => {
    if (!sqlToRun) return;
    setIsProcessing(true);
    try {
      const res = await queryAPI.execute(sqlToRun, 'Manual Editor Execution');
      setExecutionResult(res.data);
      setOutputTab('results');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: "Chat session reset. Ask a question or attach a file to start a new analysis!",
        created_at: new Date().toISOString()
      }
    ]);
    setCorrectionAlert(null);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Dual Window Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT PANE: CHATTING WINDOW (Upload files, chat, generate SQL)            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Chat Window Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  Chatting Window
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                    Live
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400">Ask questions, upload files & generate SQL</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSampleCSV}
                title="Attach Sample Sales CSV"
                className="text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-cyan-300 font-medium transition-all"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Sample CSV
              </button>
              <button
                onClick={handleClearChat}
                title="Clear Chat"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Autonomous Self-Repair Alert Banner */}
          {correctionAlert && (
            <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                <strong>Self-Repair:</strong> {correctionAlert}
              </span>
            </div>
          )}

          {/* Live Pipeline Stepper */}
          {isProcessing && pipelineStep && (
            <div className="px-3 py-1.5 bg-blue-500/10 border-b border-blue-500/20 text-[11px] flex items-center justify-between text-blue-300">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                {pipelineStep === 'retrieving_schema' && 'Retrieving database schema...'}
                {pipelineStep === 'generating_sql' && 'Synthesizing read-only MySQL query...'}
                {pipelineStep === 'validating_security' && 'Verifying AST safety guardrails...'}
                {pipelineStep === 'repairing_sql' && 'Autonomous self-healing in progress...'}
              </span>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-800 border border-slate-700 text-cyan-400'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Quick Output Window Jump Action */}
                    {!isUser && msg.sql && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setOutputTab('results')}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                          View Charts in Output Window
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleCopy(msg.sql, msg.id || index)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                        >
                          {copiedCodeId === (msg.id || index) ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy SQL</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs text-cyan-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  Processing request & updating output window...
                </div>
              </div>
            )}

            <div ref={chatMessagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3.5 py-2 border-t border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400 mb-1.5">
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span>Suggested Queries</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {(attachedFile && fileSuggestions.length > 0 ? fileSuggestions : DEFAULT_SUGGESTIONS).map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(sug)}
                  disabled={isProcessing}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700 border border-slate-700/70 text-slate-300 hover:text-white transition-all text-left truncate max-w-full"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input & File Upload Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
            {/* Attached File Pill Badge */}
            {attachedFile && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/80 border border-cyan-500/30 text-xs text-slate-200">
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate font-semibold">{attachedFile.filename}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 uppercase">
                    {attachedFile.file_type}
                  </span>
                  <span className="text-[10px] text-slate-400">({attachedFile.row_count} records)</span>
                </div>
                <button
                  onClick={() => {
                    setAttachedFile(null);
                    setFileSuggestions([]);
                  }}
                  title="Remove attached file"
                  className="p-1 hover:text-rose-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Form with integrated Attachment Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex items-center gap-2"
            >
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                accept=".csv,.xlsx,.xls,.pdf,.json,.txt,.sql,.md"
                className="hidden"
              />

              {/* Upload Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile || isProcessing}
                title="Upload file to chat with (CSV, Excel, PDF, JSON, TXT)"
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors shrink-0 disabled:opacity-50"
              >
                {isUploadingFile ? (
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder={
                  attachedFile
                    ? `Ask about ${attachedFile.filename} or ask to generate an SQL query...`
                    : 'Ask a database question, generate SQL query, or attach a file...'
                }
                disabled={isProcessing}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isProcessing}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANE: OUTPUT WINDOW (Charts, Data Tables, SQL Studio, File Preview) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Output Window Header & Tabs */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setOutputTab('results')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  outputTab === 'results'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Visual Results & Table</span>
                {executionResult && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {executionResult.row_count} rows
                  </span>
                )}
              </button>

              <button
                onClick={() => setOutputTab('sql')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  outputTab === 'sql'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>SQL Studio</span>
                {generatedSqlData && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                    Active
                  </span>
                )}
              </button>

              {attachedFile && (
                <button
                  onClick={() => setOutputTab('file')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    outputTab === 'file'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Attached File Data</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                    {attachedFile.file_type}
                  </span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2">
              <span className="font-semibold text-slate-300">Output Window</span>
            </div>
          </div>

          {/* Output Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Tab 1: Visual Results & Charts */}
            {outputTab === 'results' && (
              <div>
                {executionResult ? (
                  <Visualizer
                    data={executionResult.rows || []}
                    columns={executionResult.columns || []}
                    rowCount={executionResult.row_count || 0}
                    executionTime={executionResult.execution_time_ms || 0}
                  />
                ) : (
                  <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">No Query Executed Yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-4">
                      Type a business question in the Chatting Window on the left (or click one of the suggested prompts) to generate SQL and visualize live charts here.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-md">
                      {DEFAULT_SUGGESTIONS.slice(0, 3).map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSubmit(item)}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all text-left"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: SQL Studio & Editor */}
            {outputTab === 'sql' && (
              <div className="space-y-4">
                {generatedSqlData ? (
                  <>
                    <SqlEditor
                      sql={generatedSqlData.sql}
                      onChange={(newSql) =>
                        setGeneratedSqlData({ ...generatedSqlData, sql: newSql })
                      }
                      onExecute={() => handleManualSqlExecute(generatedSqlData.sql)}
                      isExecuting={isProcessing}
                    />

                    {generatedSqlData.relevant_tables?.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs flex items-center justify-between">
                        <span className="text-slate-400">Schema Tables Scoped:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedSqlData.relevant_tables.map((tbl, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[11px] border border-slate-700"
                            >
                              {tbl}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                      <Terminal className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">SQL Studio Ready</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Generated SQL statements will appear here with full syntax highlighting, AST read-only validation, and custom tweaking controls.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Attached File Inspector */}
            {outputTab === 'file' && attachedFile && (
              <div className="space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium">Records / Rows</span>
                    <p className="text-sm font-bold text-white mt-0.5">{attachedFile.row_count}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium">Fields / Columns</span>
                    <p className="text-sm font-bold text-cyan-400 mt-0.5">
                      {attachedFile.column_count || attachedFile.columns?.length || 1}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium">Format</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5 uppercase">
                      {attachedFile.file_type}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium">Status</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">Indexed & Active</p>
                  </div>
                </div>

                {/* Column Badges */}
                {attachedFile.columns?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Detected Fields
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {attachedFile.columns.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-200 flex items-center gap-1"
                        >
                          <strong>{c.name}</strong>
                          <span className="text-[9px] text-cyan-400">({c.type})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Sample Records Table */}
                {attachedFile.preview_data?.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Extracted Preview Data
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 max-h-72">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 sticky top-0">
                            <th className="p-2 font-semibold">#</th>
                            {Object.keys(attachedFile.preview_data[0]).map((k) => (
                              <th key={k} className="p-2 font-semibold text-slate-300 whitespace-nowrap">
                                {k}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {attachedFile.preview_data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="p-2 font-mono text-[10px] text-slate-400">{idx + 1}</td>
                              {Object.values(row).map((val, cellIdx) => (
                                <td key={cellIdx} className="p-2 whitespace-nowrap font-mono text-[11px]">
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
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                    {attachedFile.summary}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
