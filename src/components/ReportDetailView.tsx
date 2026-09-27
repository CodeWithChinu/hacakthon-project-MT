/**
 * Master Pattern Evaluation Report Detail & Workspace Component
 * Hosts General Information, Test Applicability Matrix, Tests 1 to 17,
 * Evidence Attachments, Review Sign-off, and PDF/DOCX Export.
 */

import React, { useState } from 'react';
import { EvaluationReport, UserRole, ResultState } from '../types/metrology';
import { evaluateApplicability } from '../engine/applicabilityEngine';
import { generateOimlReportPdf } from '../services/pdfGenerator';
import { generateOimlReportDocx } from '../services/docxGenerator';
import { createReportSignature } from '../services/cryptoSignature';
import { TestDetailViews } from './TestDetailViews';
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Layers,
  ArrowLeft,
  FileCheck,
  Lock,
  UserCheck,
  AlertCircle,
  Paperclip,
  History,
  Scale,
  Key,
} from 'lucide-react';

interface Props {
  report: EvaluationReport;
  role: UserRole;
  onBack: () => void;
  onUpdateReport: (updates: Partial<EvaluationReport>) => Promise<void>;
  onRunCalculations: () => Promise<void>;
  onSubmitReview: (notes: string, decision: string, reviewerName: string) => Promise<void>;
  onFinalizeReport: () => Promise<void>;
}

export const ReportDetailView: React.FC<Props> = ({
  report,
  role,
  onBack,
  onUpdateReport,
  onRunCalculations,
  onSubmitReview,
  onFinalizeReport,
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'applicability' | 'review' | 'attachments' | 'audit'>('tests');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewerDecision, setReviewerDecision] = useState<'RECOMMEND_APPROVAL' | 'REVISE_REQUIRED'>('RECOMMEND_APPROVAL');
  const [reviewerNotes, setReviewerNotes] = useState(report.reviewerNotes || '');
  const [reviewerName, setReviewerName] = useState(report.reviewerName || 'Metrology Reviewer');
  const [exporting, setExporting] = useState(false);
  const [signing, setSigning] = useState(false);

  const isAdmin = role === 'ADMIN';
  const isReviewer = role === 'REVIEWER';
  const inst = report.instrument;

  const applicabilityList = evaluateApplicability(inst);

  const handleExportPdf = () => {
    try {
      setExporting(true);
      const doc = generateOimlReportPdf(report);
      doc.save(`${report.reportNumber}_OIML_R76_Evaluation.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      setExporting(true);
      const blob = await generateOimlReportDocx(report);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.reportNumber}_OIML_R76_Evaluation.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleApplySignature = async () => {
    try {
      setSigning(true);
      const sig = await createReportSignature(report, role, role === 'ADMIN' ? report.observerName : reviewerName);
      await onUpdateReport({ signature: sig });
    } finally {
      setSigning(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitReview(reviewerNotes, reviewerDecision, reviewerName);
    setShowReviewModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Workspace Header & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dossiers
            </button>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-blue-400 uppercase font-semibold">
              OIML R 76-2 PATTERN DOSSIER
            </span>
          </div>

          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span>{report.reportNumber}</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase border ${
                report.overallResult === 'PASS'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                  : report.overallResult === 'FAIL'
                  ? 'bg-rose-950/80 text-rose-400 border-rose-700'
                  : 'bg-amber-950/80 text-amber-400 border-amber-700'
              }`}
            >
              {report.overallResult}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700 uppercase">
              {report.status}
            </span>
          </h2>

          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
            <span>Pattern: <strong className="text-white">{inst.patternDesignation}</strong></span>
            <span>Mfr: <strong className="text-slate-200">{inst.manufacturer}</strong></span>
            <span>Class: <strong className="text-slate-200">{inst.accuracyClass}</strong></span>
            <span>Max: <strong className="text-slate-200">{inst.ranges.map((r) => r.max).join('/')} {inst.units}</strong></span>
            <span>Standard: <strong className="text-blue-300">{report.ruleVersion.name}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Download PDF
          </button>

          <button
            type="button"
            onClick={handleExportDocx}
            disabled={exporting}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            Editable DOCX
          </button>

          {/* Review Decision Button (Both Reviewer & Admin permitted to review) */}
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Review Verdict
          </button>

          {/* Finalize Button (Admin only) */}
          {isAdmin && report.status !== 'FINAL' && (
            <button
              type="button"
              onClick={onFinalizeReport}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-emerald-950 text-emerald-300 hover:border-emerald-600 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              Finalize Report
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tests'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Tests 1 to 17 Hub
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('applicability')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'applicability'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Test Applicability Matrix
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'review'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          Review Verdict &amp; Signature
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attachments')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'attachments'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          Evidence Attachments ({report.attachments?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Audit Trail ({report.auditHistory?.length || 0})
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. TESTS 1 TO 17 HUB */}
      {activeTab === 'tests' && (
        <TestDetailViews
          report={report}
          role={role}
          onUpdateReport={onUpdateReport}
          onRunCalculations={onRunCalculations}
        />
      )}

      {/* 2. TEST APPLICABILITY MATRIX */}
      {activeTab === 'applicability' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              OIML R 76 Pattern Test Applicability Engine
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Determines applicability based on instrument classification, power supply, maximum capacity, verification interval e, and incorporated devices. Non-applicable tests are recorded as <span className="font-mono text-slate-300">NOT APPLICABLE</span> (never silently assumed as PASS).
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 w-16">Test #</th>
                  <th className="py-2 px-3">Test Title</th>
                  <th className="py-2 px-3 text-center">Applicable?</th>
                  <th className="py-2 px-3">Metrological Rationale / Standard Clause</th>
                  <th className="py-2 px-3 text-center">Default Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {applicabilityList.map((app) => (
                  <tr key={app.testNumber} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono font-bold text-blue-400">
                      T{app.testNumber}
                    </td>
                    <td className="py-2 px-3 font-semibold text-white">{app.testName}</td>
                    <td className="py-2 px-3 text-center">
                      {app.isApplicable ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-mono text-[10px] font-bold">
                          APPLICABLE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]">
                          EXCLUDED
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{app.reason}</td>
                    <td className="py-2 px-3 text-center font-mono text-[11px]">
                      {app.defaultStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. REVIEW VERDICT & SIGNATURE */}
      {activeTab === 'review' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Metrological Review Verdict &amp; Digital Integrity
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Authorized legal metrology review decision and cryptographic document sealing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
              <div className="font-mono text-xs font-bold text-indigo-300 uppercase">
                Official Review Decision Record
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-500">Reviewing Officer: </span>
                  <span className="font-semibold text-white">{report.reviewerName || 'Pending Assignment'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Decision: </span>
                  <span className="font-bold text-emerald-400 font-mono">{report.reviewerDecision || 'AWAITING VERDICT'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Decision Date: </span>
                  <span className="font-mono text-slate-400">{report.reviewerDecisionDate || '—'}</span>
                </div>
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Reviewer Evaluation Findings:</span>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 italic text-slate-300">
                    "{report.reviewerNotes || 'No reviewer notes recorded yet.'}"
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Signature Box */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-400 uppercase">
                  Cryptographic Seal Specification
                </span>
                <Key className="w-4 h-4 text-blue-400" />
              </div>

              <div className="text-xs space-y-1 font-mono">
                <div className="text-slate-400">
                  Status:{' '}
                  <span className="font-bold text-emerald-400">
                    {report.signature?.isSigned ? 'CRYPTOGRAPHICALLY SEALED (SHA-256)' : 'PENDING FINAL SEAL'}
                  </span>
                </div>
                <div className="text-slate-400">
                  Algorithm: <span className="text-slate-200">{report.signature?.algorithm || 'SHA-256 RSA PKCS#1 v1.5'}</span>
                </div>
                <div className="text-slate-400">
                  Signatory: <span className="text-slate-200">{report.signature?.signerName || report.observerName}</span>
                </div>
                <div className="text-slate-400 break-all">
                  SHA-256 Digest:{' '}
                  <span className="text-blue-300 text-[11px] block mt-0.5 p-1 bg-slate-900 rounded border border-slate-800">
                    {report.signature?.reportHashSha256 || 'Calculated on signing'}
                  </span>
                </div>
              </div>

              {!report.signature?.isSigned && (
                <button
                  type="button"
                  onClick={handleApplySignature}
                  disabled={signing}
                  className="mt-3 w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  {signing ? 'Computing SHA-256 Digest...' : 'Apply Cryptographic Signature'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. ATTACHMENTS */}
      {activeTab === 'attachments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-400" />
              Evidence &amp; Technical Documentation Attachments
            </h3>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Filename</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Size</th>
                  <th className="py-2 px-3">SHA-256 Hash</th>
                  <th className="py-2 px-3">Uploader</th>
                  <th className="py-2 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {report.attachments.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-white font-semibold font-sans">{att.filename}</td>
                    <td className="py-2 px-3 text-slate-400">{att.mimeType}</td>
                    <td className="py-2 px-3 text-slate-300">{(att.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="py-2 px-3 text-blue-400 text-[10px]">{att.checksumSha256}</td>
                    <td className="py-2 px-3 text-slate-400">{att.uploaderRole}</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{att.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Append-Only Dossier Audit Trail
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Actor Role</th>
                  <th className="py-2 px-3">Identifier</th>
                  <th className="py-2 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {report.auditHistory.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400">{a.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-blue-400">{a.action}</td>
                    <td className="py-2 px-3 text-slate-300">{a.actorRole}</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">{a.actorIdentifier}</td>
                    <td className="py-2 px-3 text-slate-200 font-sans">{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Verdict Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Submit Official Review Verdict
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Record the regulatory evaluation finding for dossier {report.reportNumber}.
            </p>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Reviewer Name</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Regulatory Decision</label>
                <select
                  value={reviewerDecision}
                  onChange={(e) => setReviewerDecision(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                >
                  <option value="RECOMMEND_APPROVAL">RECOMMEND PATTERN APPROVAL (All MPE &amp; Rules Passed)</option>
                  <option value="REVISE_REQUIRED">REQUIRE REVISION / RETEST (Defects or Incomplete)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Evaluation Remarks &amp; Justification</label>
                <textarea
                  rows={4}
                  required
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="State metrological compliance findings, Table 6 validation observations, and recommendations..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white placeholder-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  Submit Official Verdict
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
