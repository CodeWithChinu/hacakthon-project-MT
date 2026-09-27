/**
 * SIH NAWI OIML R 76 Legal Metrology Evaluation System
 * Non-Automatic Weighing Instruments Pattern Evaluation & Test Reporting
 *
 * Strict Two-Button Immediate Role Access: ADMIN and REVIEWER.
 * Zero username, password, email, sign-up, or login forms.
 */

import React, { useState, useEffect } from 'react';
import { UserRole, Instrument, EvaluationReport, RegulatoryRuleVersion, AuditLogEntry } from './types/metrology';
import { api } from './services/apiClient';
import { RoleAccessScreen } from './components/RoleAccessScreen';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { ReviewerDashboard } from './components/ReviewerDashboard';
import { InstrumentListModal } from './components/InstrumentListModal';
import { ReportRepositoryView } from './components/ReportRepositoryView';
import { ReportDetailView } from './components/ReportDetailView';
import { RegulatoryRulesView } from './components/RegulatoryRulesView';
import { AuditLogView } from './components/AuditLogView';
import { AutomatedTestView } from './components/AutomatedTestView';
import { NewReportModal } from './components/NewReportModal';
import {
  GOLDEN_INSTRUMENT_CLASS_III_RETAIL,
  GOLDEN_INSTRUMENT_CLASS_I_ANALYTICAL,
  GOLDEN_INSTRUMENT_CLASS_III_PLATFORM,
  GOLDEN_REPORT_RETAIL_SCALE,
} from './data/goldenCases';
import { STANDARD_RULE_VERSIONS } from './engine/regulatoryRules';

export default function App() {
  // Access role state: null means landing access screen is active
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  // Active view tab: 'dashboard' | 'repository' | 'instruments' | 'rules' | 'audit' | 'tests' | 'report-detail'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showNewReportModal, setShowNewReportModal] = useState<boolean>(false);

  // Core Datasets
  const [instruments, setInstruments] = useState<Instrument[]>([
    GOLDEN_INSTRUMENT_CLASS_III_RETAIL,
    GOLDEN_INSTRUMENT_CLASS_I_ANALYTICAL,
    GOLDEN_INSTRUMENT_CLASS_III_PLATFORM,
  ]);
  const [reports, setReports] = useState<EvaluationReport[]>([GOLDEN_REPORT_RETAIL_SCALE]);
  const [rules, setRules] = useState<RegulatoryRuleVersion[]>([...STANDARD_RULE_VERSIONS]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([...GOLDEN_REPORT_RETAIL_SCALE.auditHistory]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync data from backend
  const refreshData = async () => {
    try {
      const [fetchedInsts, fetchedReports, fetchedRules, fetchedAudits] = await Promise.all([
        api.getInstruments().catch(() => instruments),
        api.getReports().catch(() => reports),
        api.getRules().catch(() => rules),
        api.getAuditLogs().catch(() => auditLogs),
      ]);

      if (fetchedInsts?.length) setInstruments(fetchedInsts);
      if (fetchedReports?.length) setReports(fetchedReports);
      if (fetchedRules?.length) setRules(fetchedRules);
      if (fetchedAudits?.length) setAuditLogs(fetchedAudits);
    } catch {
      // Use pre-loaded datasets if backend temporarily warming up
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentRole]);

  // Handler: Immediate Role Access (ADMIN or REVIEWER)
  const handleSelectRole = (role: UserRole) => {
    api.setRole(role);
    setCurrentRole(role);
    setActiveTab('dashboard');
    showToast(`Entered application as ${role}. Role permissions active.`, 'info');
  };

  const handleSwitchRole = () => {
    setCurrentRole(null);
  };

  // Handler: Open Report
  const handleOpenReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setActiveTab('report-detail');
  };

  // Handler: Register Instrument (Admin only)
  const handleRegisterInstrument = async (instData: Partial<Instrument>) => {
    try {
      const created = await api.createInstrument(instData);
      setInstruments((prev) => [created, ...prev]);
      showToast(`Instrument registered: ${created.patternDesignation}`);
      refreshData();
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // Handler: Create Report (Admin only)
  const handleCreateReport = async (data: { instrumentId: string; ruleVersionId: string; observerName: string }) => {
    try {
      const created = await api.createReport(data);
      setReports((prev) => [created, ...prev]);
      setSelectedReportId(created.id);
      setActiveTab('report-detail');
      showToast(`Evaluation dossier created: ${created.reportNumber}`);
      refreshData();
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // Handler: Run Calculations on Active Report
  const handleRunCalculations = async () => {
    if (!selectedReportId) return;
    try {
      const res = await api.runCalculations(selectedReportId);
      setReports((prev) => prev.map((r) => (r.id === res.report.id ? res.report : r)));
      showToast(`Calculations executed. Overall Decision: ${res.report.overallResult}`);
      refreshData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handler: Update Report Data
  const handleUpdateReport = async (updates: Partial<EvaluationReport>) => {
    if (!selectedReportId) return;
    try {
      const updated = await api.updateReport(selectedReportId, updates);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast('Report updated successfully.');
      refreshData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handler: Submit Review
  const handleSubmitReview = async (notes: string, decision: string, reviewerName: string) => {
    if (!selectedReportId) return;
    try {
      const updated = await api.submitReview(selectedReportId, { notes, decision, reviewerName });
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`Review verdict submitted: ${decision}`);
      refreshData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handler: Finalize Report (Admin only)
  const handleFinalizeReport = async () => {
    if (!selectedReportId) return;
    try {
      const updated = await api.finalizeReport(selectedReportId);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`Report ${updated.reportNumber} has been finalized and locked.`);
      refreshData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 1. If no role selected, render the clean, two-button landing access screen
  if (!currentRole) {
    return <RoleAccessScreen onSelectRole={handleSelectRole} />;
  }

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold font-mono border transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200'
              : notification.type === 'info'
              ? 'bg-blue-950/90 border-blue-700 text-blue-200'
              : 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        role={currentRole}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'report-detail') setSelectedReportId(null);
        }}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          currentRole === 'ADMIN' ? (
            <AdminDashboard
              reports={reports}
              instruments={instruments}
              onOpenReport={handleOpenReport}
              onNewReport={() => setShowNewReportModal(true)}
              onNewInstrument={() => setActiveTab('instruments')}
              onViewRepository={() => setActiveTab('repository')}
              onRunTestSuite={() => setActiveTab('tests')}
            />
          ) : (
            <ReviewerDashboard
              reports={reports}
              onOpenReport={handleOpenReport}
              onViewRepository={() => setActiveTab('repository')}
            />
          )
        )}

        {/* REPORT REPOSITORY TAB */}
        {activeTab === 'repository' && (
          <ReportRepositoryView
            reports={reports}
            role={currentRole}
            onOpenReport={handleOpenReport}
            onNewReport={() => setShowNewReportModal(true)}
          />
        )}

        {/* INSTRUMENTS TAB */}
        {activeTab === 'instruments' && (
          <InstrumentListModal
            instruments={instruments}
            role={currentRole}
            onRegisterInstrument={handleRegisterInstrument}
            onSelectInstrument={(inst) => {
              if (currentRole === 'ADMIN') {
                setShowNewReportModal(true);
              }
            }}
          />
        )}

        {/* REGULATORY RULES TAB */}
        {activeTab === 'rules' && (
          <RegulatoryRulesView
            rules={rules}
            role={currentRole}
          />
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'audit' && (
          <AuditLogView
            auditLogs={auditLogs}
          />
        )}

        {/* AUTOMATED TEST SUITE TAB */}
        {activeTab === 'tests' && (
          <AutomatedTestView />
        )}

        {/* REPORT DETAIL WORKSPACE */}
        {activeTab === 'report-detail' && selectedReport && (
          <ReportDetailView
            report={selectedReport}
            role={currentRole}
            onBack={() => setActiveTab('repository')}
            onUpdateReport={handleUpdateReport}
            onRunCalculations={handleRunCalculations}
            onSubmitReview={handleSubmitReview}
            onFinalizeReport={handleFinalizeReport}
          />
        )}
      </main>

      {/* Modal: New Report Creation (ADMIN ONLY) */}
      {showNewReportModal && (
        <NewReportModal
          instruments={instruments}
          rules={rules}
          onClose={() => setShowNewReportModal(false)}
          onCreate={handleCreateReport}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-6 text-center text-xs text-slate-400 font-mono">
        SIH NAWI OIML R 76 LEGAL METROLOGY SYSTEM • APEX METROLOGICAL SUITE v2026.1
      </footer>
    </div>
  );
}
