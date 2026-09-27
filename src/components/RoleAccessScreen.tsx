/**
 * Official Role Access Landing Screen
 * Strictly two-button immediate entry: ADMIN and REVIEWER.
 * Zero username, password, email, or credential forms.
 */

import React from 'react';
import { UserRole } from '../types/metrology';
import { ShieldCheck, Scale, FileText, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

interface Props {
  onSelectRole: (role: UserRole) => void;
}

export const RoleAccessScreen: React.FC<Props> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Official Government / Legal Metrology Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/60 border border-blue-700 rounded text-blue-300">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                National Legal Metrology Laboratory
              </div>
              <h1 className="text-base font-bold text-white tracking-wide">
                Non-Automatic Weighing Instruments (NAWI) Evaluation System
              </h1>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              OIML R 76-1:2006 / R 76-2:2007
            </span>
          </div>
        </div>
      </header>

      {/* Main Landing / Access Body */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-slate-950 border border-slate-800 rounded-lg shadow-2xl p-8 sm:p-12 relative overflow-hidden">
          {/* Subtle Metrological Grid Watermark */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
            <Scale className="w-64 h-64 text-blue-400" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 mb-3 text-xs font-mono font-semibold tracking-wider uppercase text-blue-400 bg-blue-950/60 border border-blue-800 rounded">
              Pattern Evaluation & Test Reporting Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              NAWI TEST &amp; REPORTING SYSTEM
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
              OIML R76 • Legal Metrology Laboratory Pattern Evaluation. Select authorized role to proceed immediately.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-8 pb-4">
            <div className="text-center text-xs uppercase font-mono tracking-widest text-slate-400 mb-6">
              ─── SELECT ACCESS ROLE ───
            </div>

            {/* Exactly two primary access buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ADMIN BUTTON */}
              <button
                type="button"
                onClick={() => onSelectRole('ADMIN')}
                className="group relative flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-blue-950/80 border-2 border-slate-700 hover:border-blue-500 rounded-lg transition-all duration-200 text-left cursor-pointer shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-full bg-blue-900/50 border border-blue-600 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-lg font-bold text-white tracking-wider uppercase font-mono">
                  ADMIN
                </div>
                <div className="text-xs text-blue-300/80 mt-1 font-mono text-center">
                  Full Laboratory Administration
                </div>
                <ul className="mt-3 text-[11px] text-slate-400 space-y-1 w-full border-t border-slate-800 pt-3">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Register instruments &amp; tests
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Enter observations &amp; data
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Run calculation &amp; MPE engine
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Generate &amp; finalize reports
                  </li>
                </ul>
                <div className="mt-4 w-full py-2 bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-bold text-center uppercase tracking-wider rounded transition-colors">
                  ENTER AS ADMIN &rarr;
                </div>
              </button>

              {/* REVIEWER BUTTON */}
              <button
                type="button"
                onClick={() => onSelectRole('REVIEWER')}
                className="group relative flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-indigo-950/80 border-2 border-slate-700 hover:border-indigo-500 rounded-lg transition-all duration-200 text-left cursor-pointer shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-900/50 border border-indigo-600 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-3">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="text-lg font-bold text-white tracking-wider uppercase font-mono">
                  REVIEWER
                </div>
                <div className="text-xs text-indigo-300/80 mt-1 font-mono text-center">
                  Metrological Compliance Review
                </div>
                <ul className="mt-3 text-[11px] text-slate-400 space-y-1 w-full border-t border-slate-800 pt-3">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    Inspect reports &amp; calculations
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    Audit compliance decisions
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    Submit official review verdicts
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-xs font-bold mr-0.5">•</span>
                    Enforced 403 on report edits
                  </li>
                </ul>
                <div className="mt-4 w-full py-2 bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold text-center uppercase tracking-wider rounded transition-colors">
                  ENTER AS REVIEWER &rarr;
                </div>
              </button>
            </div>
          </div>

          {/* Legal / Architecture Notice */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400 bg-slate-900/50 p-3.5 rounded border border-slate-800">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-semibold">Hackathon / Regulatory Demo Architecture Notice:</span> Conventional username/password credentials have been deliberately removed. Role-based authorization is enforced internally and at the API level (Reviewer attempts to modify reports or instruments return HTTP 403 Forbidden).
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-3 px-6 text-center text-xs text-slate-400 font-mono">
        SIH NAWI OIML R 76 LEGAL METROLOGY SYSTEM • APEX METROLOGICAL SUITE v2026.1
      </footer>
    </div>
  );
};
