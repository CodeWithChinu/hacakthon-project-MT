/**
 * Report Repository & Search Component
 * Supports multi-parameter filtering, sorting, preview, and PDF/DOCX downloads.
 */

import React, { useState } from 'react';
import { EvaluationReport, UserRole } from '../types/metrology';
import { generateOimlReportPdf } from '../services/pdfGenerator';
import { generateOimlReportDocx } from '../services/docxGenerator';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
} from 'lucide-react';

interface Props {
  reports: EvaluationReport[];
  role: UserRole;
  onOpenReport: (id: string) => void;
  onNewReport: () => void;
}

export const ReportRepositoryView: React.FC<Props> = ({
  reports,
  role,
  onOpenReport,
  onNewReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [ruleFilter, setRuleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'reportNumber' | 'manufacturer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const isAdmin = role === 'ADMIN';

  const filtered = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.reportNumber.toLowerCase().includes(q) ||
      r.instrument.patternDesignation.toLowerCase().includes(q) ||
      r.instrument.manufacturer.toLowerCase().includes(q) ||
      r.instrument.serialNumber.toLowerCase().includes(q) ||
      r.observerName.toLowerCase().includes(q) ||
      (r.reviewerName && r.reviewerName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesClass = classFilter === 'ALL' || r.instrument.accuracyClass === classFilter;
    const matchesRule = ruleFilter === 'ALL' || r.ruleVersion.code === ruleFilter;

    return matchesSearch && matchesStatus && matchesClass && matchesRule;
  });

  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'reportNumber') {
      comparison = a.reportNumber.localeCompare(b.reportNumber);
    } else if (sortBy === 'manufacturer') {
      comparison = a.instrument.manufacturer.localeCompare(b.instrument.manufacturer);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleDownloadPdf = (r: EvaluationReport) => {
    const doc = generateOimlReportPdf(r);
    doc.save(`${r.reportNumber}_Evaluation.pdf`);
  };

  const handleDownloadDocx = async (r: EvaluationReport) => {
    const blob = await generateOimlReportDocx(r);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.reportNumber}_Evaluation.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            Pattern Evaluation Dossier Repository
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Archival repository of all verified OIML R 76-2 pattern evaluation reports.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onNewReport}
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
          >
            + Create New Report
          </button>
        )}
      </div>

      {/* Multi-parameter Search and Filter Row */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Report #, Pattern, Manufacturer, Serial, Officer, or Reviewer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="APPROVED">Approved</option>
              <option value="FINAL">Final</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono"
            >
              <option value="ALL">All Classes</option>
              <option value="I">Class I</option>
              <option value="II">Class II</option>
              <option value="III">Class III</option>
              <option value="IIII">Class IIII</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono"
            >
              <option value="date">Evaluation Date</option>
              <option value="reportNumber">Report Number</option>
              <option value="manufacturer">Manufacturer</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/70 font-mono text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Report Number</th>
                <th className="py-2.5 px-4">Pattern Designation</th>
                <th className="py-2.5 px-4">Manufacturer</th>
                <th className="py-2.5 px-4">Class</th>
                <th className="py-2.5 px-4">Standard</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Result</th>
                <th className="py-2.5 px-4 text-right">Downloads &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching evaluation reports found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          r.overallResult === 'PASS'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700'
                            : r.overallResult === 'FAIL'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-700'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-700'
                        }`}
                      >
                        {r.overallResult}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(r)}
                          title="Download PDF"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadDocx(r)}
                          title="Download DOCX"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenReport(r.id)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs ml-1 cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
