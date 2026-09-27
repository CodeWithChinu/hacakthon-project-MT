/**
 * Reviewer Dashboard
 * Focused strictly on metrological inspection, review queues, compliance verification, and audit.
 * Admin creation buttons and configuration controls are omitted.
 */

import React, { useState } from 'react';
import { EvaluationReport } from '../types/metrology';
import {
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  AlertCircle,
  Eye,
  Filter,
} from 'lucide-react';

interface Props {
  reports: EvaluationReport[];
  onOpenReport: (reportId: string) => void;
  onViewRepository: () => void;
}

export const ReviewerDashboard: React.FC<Props> = ({ reports, onOpenReport, onViewRepository }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const awaitingReview = reports.filter((r) => r.status === 'IN_REVIEW' || r.status === 'COMPLETED');
  const recentlyApproved = reports.filter((r) => r.status === 'APPROVED' || r.status === 'FINAL');

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.instrument.patternDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.instrument.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Reviewer Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase text-indigo-400 font-semibold tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            OFFICIAL METROLOGICAL REVIEWER PORTAL
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Compliance Inspection &amp; Approval Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Independent verification of calculation engines, Table 6 MPE compliance, test observations, and physical conformity.
          </p>
        </div>

        <div className="bg-indigo-950/60 border border-indigo-700/80 px-4 py-2.5 rounded-lg text-right">
          <div className="text-[11px] font-mono text-indigo-300 uppercase">Awaiting Action</div>
          <div className="text-xl font-bold text-indigo-200">{awaitingReview.length} Dossiers</div>
        </div>
      </div>

      {/* Reviewer Queue Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-indigo-300 uppercase">Queue Awaiting Review</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{awaitingReview.length}</div>
          <div className="text-xs text-slate-400 mt-1">Reports ready for regulatory review</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 uppercase">Approved / Finalized</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{recentlyApproved.length}</div>
          <div className="text-xs text-slate-400 mt-1">Signed &amp; certified pattern evaluations</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total in Repository</span>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{reports.length}</div>
          <div className="text-xs text-slate-400 mt-1">Full evaluation archive access</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search dossiers by Report #, Pattern Designation, Manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="APPROVED">Approved</option>
            <option value="DRAFT">Draft</option>
            <option value="FINAL">Final</option>
          </select>
        </div>
      </div>

      {/* Review Dossiers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            Evaluation Dossiers for Regulatory Inspection
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filtered.length} of {reports.length} dossiers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-mono border-b border-slate-800 uppercase">
              <tr>
                <th className="py-2.5 px-4">Report #</th>
                <th className="py-2.5 px-4">Pattern Designation</th>
                <th className="py-2.5 px-4">Manufacturer</th>
                <th className="py-2.5 px-4">Class</th>
                <th className="py-2.5 px-4">Evaluator</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Decision</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching reports found for review.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isPass = r.overallResult === 'PASS';
                  const isApproved = r.reviewerDecision === 'RECOMMEND_APPROVAL';

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-300">
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
                      <td className="py-3 px-4 text-slate-400">{r.observerName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isApproved
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {r.reviewerDecision || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenReport(r.id)}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect &amp; Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
