
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoiceAssistant from './components/VoiceAssistant';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { SystemLog, Note, SystemState, FileAsset } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { saveNotes, loadNotes, saveFiles, loadFiles, saveLogs, loadLogs } from './storage';

type AIMode = 'voice' | 'chat';

const App: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [logs, setLogs] = useState<SystemLog[]>(() => loadLogs());
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [files, setFiles] = useState<FileAsset[]>(() => loadFiles());
  const [aiMode, setAiMode] = useState<AIMode>('chat');
  const startTimeRef = useRef(Date.now());
  const [systemState, setSystemState] = useState<SystemState>({
    cpuUsage: 12,
    ramUsage: 45,
    diskUsage: 68,
    uptime: '00:00:00',
    activeWindow: 'JARVIS Dashboard',
    notifications: 0,
  });

  // Persist data on change
  useEffect(() => { saveNotes(notes); }, [notes]);
  useEffect(() => { saveFiles(files); }, [files]);
  useEffect(() => { saveLogs(logs); }, [logs]);

  const addLog = useCallback((message: string, type: 'action' | 'info' | 'error' = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const addNote = (content: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 11),
      content,
      timestamp: new Date().toLocaleString(),
    };
    setNotes(prev => [newNote, ...prev]);
    addLog(`Nota creata: "${content.substring(0, 20)}..."`, 'action');
  };

  const addFile = (name: string, content: string) => {
    const newFile: FileAsset = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      content,
      type: name.split('.').pop() || 'txt',
      timestamp: new Date().toLocaleString(),
      size: new Blob([content]).size,
    };
    setFiles(prev => [newFile, ...prev]);
    addLog(`File creato: ${name} (${newFile.size} bytes)`, 'action');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    addLog('Nota eliminata', 'action');
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    addLog('File eliminato', 'action');
  };

  // Real uptime counter + simulated system metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');

      setSystemState(prev => ({
        ...prev,
        uptime: `${hours}:${minutes}:${seconds}`,
        cpuUsage: Math.max(5, Math.min(95, prev.cpuUsage + (Math.random() * 10 - 5))),
        ramUsage: Math.max(40, Math.min(60, prev.ramUsage + (Math.random() * 2 - 1))),
        notifications: notes.length + files.length,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [notes.length, files.length]);

  // Log online/offline transitions
  useEffect(() => {
    addLog(isOnline ? 'Connessione rete ristabilita.' : 'Connessione persa — modalità offline attiva.', isOnline ? 'info' : 'error');
  }, [isOnline, addLog]);

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-100 overflow-hidden relative">
      <div className="scanline"></div>
      
      <Sidebar systemState={systemState} isOnline={isOnline} />

      <main className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden relative z-20">
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-sky-400">JARVIS_OS <span className="text-slate-500 font-normal">v4.3.0</span></h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Kernel active - Authorization: Admin</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Online/Offline Status Badge */}
            <div className={`px-3 py-1 rounded border text-xs font-mono flex items-center ${
              isOnline
                ? 'bg-slate-900 border-slate-700 text-emerald-400'
                : 'bg-amber-900/20 border-amber-700/50 text-amber-400 offline-pulse'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}></span>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-slate-400">UPTIME: {systemState.uptime}</p>
              <p className="text-xs font-mono text-slate-400">ID: JARVIS-SYS-PRIME</p>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6 overflow-hidden">
            <Dashboard logs={logs} notes={notes} files={files} systemState={systemState} onDeleteNote={deleteNote} onDeleteFile={deleteFile} />
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
            <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col border border-sky-900/30 neon-glow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg flex items-center">
                  <span className={`w-4 h-4 rounded-full mr-3 ${
                    isOnline
                      ? 'bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                      : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  }`}></span>
                  AI Interface
                </h2>
                <span className="text-xs font-mono text-sky-500">
                  {!isOnline ? 'OFFLINE_ENGINE' : aiMode === 'voice' ? 'GEMINI_LIVE_v2.5' : 'GEMINI_CHAT_v2.5'}
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
                  disabled={!isOnline}
                  title={!isOnline ? 'Voice richiede connessione internet' : ''}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                    aiMode === 'voice'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  } ${!isOnline ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                  <span>Voice</span>
                </button>
              </div>

              {!isOnline && (
                <div className="mb-3 px-3 py-2 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                  <p className="text-[10px] text-amber-400 font-mono">⚡ OFFLINE MODE — AI locale attiva. Funzioni base disponibili.</p>
                </div>
              )}

              {aiMode === 'voice' && isOnline ? (
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
                  isOnline={isOnline}
                  notesCount={notes.length}
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
