
import React from 'react';
import { SystemLog, Note, SystemState, FileAsset } from '../types';

interface DashboardProps {
  logs: SystemLog[];
  notes: Note[];
  files: FileAsset[];
  systemState: SystemState;
}

const Dashboard: React.FC<DashboardProps> = ({ logs, notes, files, systemState }) => {
  const downloadFile = (file: FileAsset) => {
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

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
      <div className="grid grid-cols-3 gap-6">
        <StatCard title="WINDOWS" value={systemState.activeWindow} color="sky" />
        <StatCard title="FILES STORAGE" value={`${files.length} Assets`} color="emerald" />
        <StatCard title="SECURITY" value="ALPHA PROTOCOL" color="amber" />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Console Logs */}
        <div className="col-span-12 lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col border border-slate-800 overflow-hidden">
          <h3 className="text-sm font-mono text-slate-400 mb-4 uppercase tracking-widest flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            System Console
          </h3>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
            {logs.length === 0 ? (
              <p className="text-slate-600">No activity logged.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex space-x-2 border-l border-slate-800 pl-2">
                  <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                  <span className={
                    log.type === 'action' ? 'text-sky-400' : 
                    log.type === 'error' ? 'text-red-400' : 'text-slate-400'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* File Manager */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col border border-slate-800 overflow-hidden">
          <h3 className="text-sm font-mono text-slate-400 mb-4 uppercase tracking-widest flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            File Explorer
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p>No files generated.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-800 hover:border-sky-500/50 group transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-sky-500 font-bold text-[10px] uppercase">
                        {file.type}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{file.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{file.size} bytes • {file.timestamp}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => downloadFile(file)}
                      className="p-2 rounded bg-sky-500/10 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sky-500 hover:text-white"
                      title="Download File"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; color: 'sky' | 'emerald' | 'amber' }> = ({ title, value, color }) => {
  const colorMap = {
    sky: 'text-sky-400 border-sky-900/30',
    emerald: 'text-emerald-400 border-emerald-900/30',
    amber: 'text-amber-400 border-amber-900/30',
  };
  return (
    <div className={`glass-panel p-4 rounded-xl border ${colorMap[color]}`}>
      <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">{title}</p>
      <p className="text-lg font-bold truncate">{value}</p>
    </div>
  );
};

export default Dashboard;
