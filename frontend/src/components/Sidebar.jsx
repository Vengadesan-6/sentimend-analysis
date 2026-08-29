import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  FileSpreadsheet,
  History,
  BarChart3,
  Gauge,
  Sparkles,
  Database,
  Cpu,
  Server,
  ChevronRight
} from 'lucide-react';
import { checkHealth } from '../services/api';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyze', label: 'Single Text Analysis', icon: BrainCircuit, badge: 'Live AI' },
  { path: '/bulk-analysis', label: 'Bulk CSV Processing', icon: FileSpreadsheet, badge: 'Batch' },
  { path: '/history', label: 'Prediction History', icon: History },
  { path: '/analytics', label: 'Deep Analytics', icon: BarChart3 },
  { path: '/model-performance', label: 'Model Benchmarks', icon: Gauge },
];

export default function Sidebar() {
  const [health, setHealth] = useState({
    api: true,
    database: true,
    models_loaded: true,
    device: 'cpu'
  });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await checkHealth();
        if (res.data) setHealth(res.data);
      } catch (err) {
        setHealth({ api: false, database: false, models_loaded: false, device: 'cpu' });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-[#090D16]/90 border-r border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between shrink-0 z-30 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                Sentix<span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">CAPSTONE PLATFORM</p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Intelligence Modules
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Live System Diagnostics Status Bar */}
      <div className="p-4 m-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Live System Telemetry
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 uppercase">
            {health.device}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Models */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Server className="w-3 h-3 text-slate-500" />
              Transformers
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${health.models_loaded ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400'}`} />
              <span className="text-[11px] font-mono text-slate-300">
                {health.models_loaded ? 'Ready' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Database */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-slate-500" />
              MongoDB
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${health.database ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400'}`} />
              <span className="text-[11px] font-mono text-slate-300">
                {health.database ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
