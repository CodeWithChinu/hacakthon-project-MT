/**
 * Application Navigation Bar
 * Features Active Role Indicator, Role Switcher, and section navigation.
 */

import React from 'react';
import { UserRole } from '../types/metrology';
import {
  Scale,
  Shield,
  UserCheck,
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  BookOpen,
  ClipboardList,
  CheckCircle,
  RefreshCw,
  LogOut,
} from 'lucide-react';

interface Props {
  role: UserRole;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchRole: () => void;
}

export const Navbar: React.FC<Props> = ({ role, activeTab, onSelectTab, onSwitchRole }) => {
  const isAdmin = role === 'ADMIN';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-900/60 border border-blue-700 rounded text-blue-300">
            <Scale className="w-5 h-5" />
          </div>
          <div className="cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="text-[10px] tracking-widest uppercase font-mono text-slate-400">
              OIML R 76 • LEGAL METROLOGY
            </div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              NAWI Evaluation Portal
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('repository')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'repository'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Reports Repository
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('instruments')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'instruments'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Instruments
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('rules')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Rule Standards
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('audit')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Audit Trail
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('tests')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Verification Suite
          </button>
        </nav>

        {/* Role & Switcher Control */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wider uppercase border ${
              isAdmin
                ? 'bg-blue-950/80 border-blue-600 text-blue-300'
                : 'bg-indigo-950/80 border-indigo-600 text-indigo-300'
            }`}
          >
            {isAdmin ? <Shield className="w-3.5 h-3.5 text-blue-400" /> : <UserCheck className="w-3.5 h-3.5 text-indigo-400" />}
            <span>ROLE: {role}</span>
          </div>

          <button
            type="button"
            onClick={onSwitchRole}
            title="Switch Access Role (Admin / Reviewer)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Switch Role</span>
          </button>
        </div>
      </div>
    </header>
  );
};
