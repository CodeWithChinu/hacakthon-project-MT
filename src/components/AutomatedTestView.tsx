/**
 * Automated Metrological & Authorization Verification Test Suite UI
 * Runs live checks against calculation engine, MPE engine, applicability rules,
 * result states, and role-based permissions.
 */

import React, { useState } from 'react';
import { runAllAutomatedTests, TestSuiteSummary } from '../engine/testRunner';
import { CheckCircle2, XCircle, Play, RefreshCw, ShieldCheck, Calculator } from 'lucide-react';

export const AutomatedTestView: React.FC = () => {
  const [suiteSummary, setSuiteSummary] = useState<TestSuiteSummary | null>(() => runAllAutomatedTests());
  const [running, setRunning] = useState(false);

  const handleExecuteTests = () => {
    setRunning(true);
    setTimeout(() => {
      const res = runAllAutomatedTests();
      setSuiteSummary(res);
      setRunning(false);
    }, 200);
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Automated Metrological &amp; Authorization Verification Suite
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Executes unit assertions on Table 6 MPE brackets, decimal arithmetic, zero corrections, and role permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExecuteTests}
          disabled={running}
          className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? 'Executing Assertions...' : 'Run All Automated Tests'}
        </button>
      </div>

      {suiteSummary && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Total Assertions</div>
              <div className="text-2xl font-bold text-white mt-1">{suiteSummary.total}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-[11px] font-mono text-emerald-400 uppercase">Passed</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{suiteSummary.passed}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-[11px] font-mono text-rose-400 uppercase">Failed</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{suiteSummary.failed}</div>
            </div>
          </div>

          {/* Test Results Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/70 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 w-40">Test Suite</th>
                    <th className="py-2.5 px-4">Assertion Name</th>
                    <th className="py-2.5 px-4">Expected</th>
                    <th className="py-2.5 px-4">Actual</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {suiteSummary.results.map((res, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-semibold text-blue-400">{res.suite}</td>
                      <td className="py-2.5 px-4 font-sans text-white">{res.name}</td>
                      <td className="py-2.5 px-4 text-slate-400">{res.expected || '—'}</td>
                      <td className="py-2.5 px-4 text-slate-300">{res.actual || '—'}</td>
                      <td className="py-2.5 px-4 text-center">
                        {res.passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-700">
                            <XCircle className="w-3 h-3" /> FAIL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
