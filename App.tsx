
import React, { useState, useEffect, useRef } from 'react';
import VoiceAssistant from './components/VoiceAssistant';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { SystemLog, Note, SystemState, FileAsset, BrainSnapshot, BrainCommandResult } from './types';
import { AIBrain } from './brain';

const App: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const brainRef = useRef(new AIBrain());
  const [brainSnapshot, setBrainSnapshot] = useState<BrainSnapshot>(brainRef.current.getSnapshot());
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

  const triggerDownload = (file: FileAsset) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onTextCommand = (input: string): BrainCommandResult => {
    const decision = brainRef.current.runCycle(input, { notes, files, systemState });
    setBrainSnapshot(brainRef.current.getSnapshot());

    if (!decision.allowed || decision.blocked) {
      addLog(`BRAIN_SAFETY_BLOCK: ${decision.intent}`, 'error');
      return {
        decisionId: decision.id,
        response: decision.response,
        blocked: true,
        canGiveFeedback: false,
      };
    }

    if (decision.action?.type === 'create_note') {
      addNote(String(decision.action.payload.content ?? ''));
    } else if (decision.action?.type === 'create_file') {
      addFile(String(decision.action.payload.name ?? 'file.txt'), String(decision.action.payload.content ?? ''));
    } else if (decision.action?.type === 'download_file') {
      const name = String(decision.action.payload.name ?? '').trim();
      const file = files.find((f) => f.name.toLowerCase() === name.toLowerCase());
      if (file) {
        triggerDownload(file);
        addLog(`Download file avviato: ${file.name}`, 'action');
      } else {
        addLog(`Download fallito: file non trovato (${name})`, 'error');
        return {
          decisionId: decision.id,
          response: 'File non trovato: controlla il nome esatto.',
          blocked: false,
          canGiveFeedback: true,
        };
      }
    } else if (decision.action?.type === 'open_application') {
      const appName = String(decision.action.payload.appName ?? systemState.activeWindow);
      setSystemState((prev) => ({ ...prev, activeWindow: appName }));
      addLog(`Finestra attiva aggiornata: ${appName}`, 'action');
    } else if (decision.action?.type === 'get_system_info') {
      addLog('Richiesta info sistema elaborata dal brain.', 'info');
    }

    addLog(`BRAIN_EXEC: ${decision.intent}`, 'action');
    return {
      decisionId: decision.id,
      response: decision.response,
      blocked: false,
      canGiveFeedback: decision.intent !== 'help' && decision.intent !== 'unknown',
    };
  };

  const onBrainFeedback = (decisionId: string, positive: boolean): string => {
    const message = brainRef.current.learn(decisionId, positive);
    setBrainSnapshot(brainRef.current.getSnapshot());
    addLog(`BRAIN_LEARN: ${positive ? 'positive' : 'negative'} feedback`, 'info');
    return message;
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
            <Dashboard logs={logs} notes={notes} files={files} systemState={systemState} brainSnapshot={brainSnapshot} />
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
            <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col border border-sky-900/30 neon-glow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg flex items-center">
                  <span className="w-4 h-4 bg-sky-500 rounded-full mr-3 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
                  AI Interface
                </h2>
                <span className="text-xs font-mono text-sky-500">GEMINI_LIVE_v2.5</span>
              </div>
              
              <VoiceAssistant 
                addLog={addLog} 
                addNote={addNote} 
                addFile={addFile}
                setSystemState={setSystemState} 
                files={files}
                onTextCommand={onTextCommand}
                onBrainFeedback={onBrainFeedback}
                brainSnapshot={brainSnapshot}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
