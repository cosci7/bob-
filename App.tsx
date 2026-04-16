
import React, { useState, useEffect } from 'react';
import VoiceAssistant from './components/VoiceAssistant';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { SystemLog, Note, SystemState, FileAsset } from './types';

type AIMode = 'voice' | 'chat';

const App: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [aiMode, setAiMode] = useState<AIMode>('chat');
  const [systemState, setSystemState] = useState<SystemState>({
    cpuUsage: 12,
    ramUsage: 45,
    diskUsage: 68,
    uptime: '02:14:55',
    activeWindow: 'JARVIS Dashboard',
    notifications: 0,
  });

  const addLog = (message: string, type: 'action' | 'info' | 'error' = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const addNote = (content: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      timestamp: new Date().toLocaleString(),
    };
    setNotes(prev => [newNote, ...prev]);
    addLog(`Nota creata: "${content.substring(0, 20)}..."`, 'action');
  };

  const addFile = (name: string, content: string) => {
    const newFile: FileAsset = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      content,
      type: name.split('.').pop() || 'txt',
      timestamp: new Date().toLocaleString(),
      size: new Blob([content]).size,
    };
    setFiles(prev => [newFile, ...prev]);
    addLog(`File creato: ${name} (${newFile.size} bytes)`, 'action');
  };

  // Mock system updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemState(prev => ({
        ...prev,
        cpuUsage: Math.max(5, Math.min(95, prev.cpuUsage + (Math.random() * 10 - 5))),
        ramUsage: Math.max(40, Math.min(60, prev.ramUsage + (Math.random() * 2 - 1))),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-100 overflow-hidden relative">
      <div className="scanline"></div>
      
      <Sidebar systemState={systemState} />

      <main className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden relative z-20">
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-sky-400">JARVIS_OS <span className="text-slate-500 font-normal">v4.2.0</span></h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Kernel active - Authorization: Admin</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              READY
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-slate-400">LATENCY: 12ms</p>
              <p className="text-xs font-mono text-slate-400">ID: JARVIS-SYS-PRIME</p>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6 overflow-hidden">
            <Dashboard logs={logs} notes={notes} files={files} systemState={systemState} />
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
            <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col border border-sky-900/30 neon-glow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg flex items-center">
                  <span className="w-4 h-4 bg-sky-500 rounded-full mr-3 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
                  AI Interface
                </h2>
                <span className="text-xs font-mono text-sky-500">
                  {aiMode === 'voice' ? 'GEMINI_LIVE_v2.5' : 'GEMINI_CHAT_v2.5'}
                </span>
              </div>

              {/* Mode Switcher */}
              <div className="flex mb-4 bg-slate-900/60 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={() => setAiMode('chat')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                    aiMode === 'chat'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => setAiMode('voice')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                    aiMode === 'voice'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                  <span>Voice</span>
                </button>
              </div>

              {aiMode === 'voice' ? (
                <VoiceAssistant
                  addLog={addLog}
                  addNote={addNote}
                  addFile={addFile}
                  setSystemState={setSystemState}
                  files={files}
                />
              ) : (
                <ChatInterface
                  addLog={addLog}
                  addNote={addNote}
                  addFile={addFile}
                  setSystemState={setSystemState}
                  files={files}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
