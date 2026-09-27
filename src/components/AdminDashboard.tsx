/**
 * Admin Dashboard
 * Exposes full laboratory metrics, creation shortcuts, and recent activity.
 */

import React from 'react';
import { EvaluationReport, Instrument } from '../types/metrology';
import {
  Layers,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface Props {
  reports: EvaluationReport[];
  instruments: Instrument[];
  onOpenReport: (reportId: string) => void;
  onNewReport: () => void;
  onNewInstrument: () => void;
  onViewRepository: () => void;
  onRunTestSuite: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  reports,
  instruments,
  onOpenReport,
  onNewReport,
  onNewInstrument,
  onViewRepository,
  onRunTestSuite,
}) => {
  const totalReports = reports.length;
  const draftReports = reports.filter((r) => r.status === 'DRAFT').length;
  const inReviewReports = reports.filter((r) => r.status === 'IN_REVIEW').length;
  const completedReports = reports.filter((r) => r.status === 'COMPLETED' || r.status === 'APPROVED' || r.status === 'FINAL').length;
  const passedReports = reports.filter((r) => r.overallResult === 'PASS').length;
  const failedReports = reports.filter((r) => r.overallResult === 'FAIL').length;
  const incompleteReports = reports.filter((r) => r.overallResult === 'INCOMPLETE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-lg">
        <div>
          <div className="text-xs font-mono uppercase text-blue-400 font-semibold tracking-wider">
            ADMINISTRATIVE LABORATORY OVERVIEW
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            NAWI Type Evaluation &amp; Verification Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative pattern evaluation pursuant to OIML R 76-1:2006 (E) and R 76-2:2007 (E).
          </p>
        </div>

        {/* Admin Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNewReport}
            className="px-3.5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <PlusCircle className="w-4 h-4" />
            New Evaluation Report
          </button>
          <button
            type="button"
            onClick={onNewInstrument}
            className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            Register Instrument
          </button>
          <button
            type="button"
            onClick={onRunTestSuite}
            className="px-3.5 py-2 rounded bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-medium border border-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Run Test Suite
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Instruments</div>
          <div className="text-2xl font-bold text-white mt-1">{instruments.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Registered NAWIs</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Reports</div>
          <div className="text-2xl font-bold text-white mt-1">{totalReports}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Evaluation dossiers</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-mono text-amber-400 uppercase">Drafts</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{draftReports}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Under test entry</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-mono text-indigo-400 uppercase">In Review</div>
          <div className="text-2xl font-bold text-indigo-300 mt-1">{inReviewReports}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting reviewer</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-mono text-emerald-400 uppercase">Passed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{passedReports}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Conforms (MPE pass)</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-mono text-rose-400 uppercase">Failed</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{failedReports}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Exceeds MPE</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
          <div className="text-[11px] font-mono text-amber-400 uppercase">Incomplete</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{incompleteReports}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pending tests</div>
        </div>
      </div>

      {/* Recent Evaluation Reports */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Recent Pattern Evaluation Reports</h3>
          </div>
          <button
            type="button"
            onClick={onViewRepository}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            View Repository &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-mono border-b border-slate-800 uppercase">
              <tr>
                <th className="py-2.5 px-4">Report #</th>
                <th className="py-2.5 px-4">Pattern Designation</th>
                <th className="py-2.5 px-4">Manufacturer</th>
                <th className="py-2.5 px-4">Class</th>
                <th className="py-2.5 px-4">Standard</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Result</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {reports.map((r) => {
                const isPass = r.overallResult === 'PASS';
                const isFail = r.overallResult === 'FAIL';
                const isIncomplete = r.overallResult === 'INCOMPLETE';

                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-blue-400">
                      {r.reportNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {r.instrument.patternDesignation}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {r.instrument.instrumentCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{r.instrument.manufacturer}</td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]">
                        Class {r.instrument.accuracyClass}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {r.ruleVersion.code}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          isPass
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700'
                            : isFail
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-700'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-700'
                        }`}
                      >
                        {isPass && <CheckCircle2 className="w-3 h-3" />}
                        {isFail && <XCircle className="w-3 h-3" />}
                        {isIncomplete && <Clock className="w-3 h-3" />}
                        {r.overallResult}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenReport(r.id)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        Open Workspace
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
