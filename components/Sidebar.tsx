
import React from 'react';
import { SystemState } from '../types';

interface SidebarProps {
  systemState: SystemState;
}

const Sidebar: React.FC<SidebarProps> = ({ systemState }) => {
  return (
    <aside className="w-64 border-r border-slate-800 p-6 flex flex-col glass-panel z-30">
      <div className="mb-10">
        <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(2,132,199,0.5)]">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white tracking-wider">OMNICORE</h2>
        <p className="text-xs text-slate-500 uppercase tracking-tighter">Neural Assistant</p>
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem active icon={<HomeIcon />} label="Dashboard" />
        <NavItem icon={<FileIcon />} label="Files" />
        <NavItem icon={<NetworkIcon />} label="Network" />
        <NavItem icon={<ConfigIcon />} label="Config" />
      </nav>

      <div className="mt-auto space-y-6">
        <div>
          <div className="flex justify-between text-[10px] mb-1 text-slate-400 font-mono uppercase tracking-widest">
            <span>CPU Load</span>
            <span>{Math.round(systemState.cpuUsage)}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-500 transition-all duration-1000" 
              style={{ width: `${systemState.cpuUsage}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] mb-1 text-slate-400 font-mono uppercase tracking-widest">
            <span>Memory</span>
            <span>{Math.round(systemState.ramUsage)}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-1000" 
              style={{ width: `${systemState.ramUsage}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
          <p className="text-[10px] text-slate-500 font-mono">UPTIME</p>
          <p className="text-sm font-mono text-slate-300">{systemState.uptime}</p>
        </div>
      </div>
    </aside>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <div className={`flex items-center p-3 rounded-xl transition-all cursor-pointer ${active ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
    <span className="mr-3">{icon}</span>
    <span className="font-medium">{label}</span>
  </div>
);

const HomeIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const FileIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const NetworkIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ConfigIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export default Sidebar;
