/**
 * Metrology API Client
 * Automatically attaches current User Role header ('x-app-role')
 */

import { UserRole, Instrument, EvaluationReport, RegulatoryRuleVersion, AuditLogEntry } from '../types/metrology';

class ApiClient {
  private currentRole: UserRole = 'ADMIN';

  setRole(role: UserRole) {
    this.currentRole = role;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nawi_app_role', role);
    }
  }

  getRole(): UserRole {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nawi_app_role') as UserRole;
      if (saved === 'ADMIN' || saved === 'REVIEWER') {
        this.currentRole = saved;
      }
    }
    return this.currentRole;
  }

  private headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-app-role': this.getRole(),
    };
  }

  async getRoleStatus() {
    const res = await fetch('/api/role-status', { headers: this.headers() });
    return res.json();
  }

  async getInstruments(): Promise<Instrument[]> {
    const res = await fetch('/api/instruments', { headers: this.headers() });
    if (!res.ok) throw new Error('Failed to fetch instruments');
    return res.json();
  }

  async createInstrument(inst: Partial<Instrument>): Promise<Instrument> {
    const res = await fetch('/api/instruments', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(inst),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create instrument' }));
      throw new Error(err.error || 'Failed to create instrument');
    }
    return res.json();
  }

  async getReports(params?: { search?: string; status?: string; accuracyClass?: string }): Promise<EvaluationReport[]> {
    const qs = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/reports?${qs}`, { headers: this.headers() });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  }

  async getReport(id: string): Promise<EvaluationReport> {
    const res = await fetch(`/api/reports/${id}`, { headers: this.headers() });
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
  }

  async createReport(data: { instrumentId: string; ruleVersionId: string; observerName: string }): Promise<EvaluationReport> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create report' }));
      throw new Error(err.error || 'Failed to create report');
    }
    return res.json();
  }

  async updateReport(id: string, updates: Partial<EvaluationReport>): Promise<EvaluationReport> {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update report' }));
      throw new Error(err.error || 'Failed to update report');
    }
    return res.json();
  }

  async runCalculations(id: string): Promise<{ report: EvaluationReport; logs: string[] }> {
    const res = await fetch(`/api/reports/${id}/calculate`, {
      method: 'POST',
      headers: this.headers(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Calculation engine failed' }));
      throw new Error(err.error || 'Calculation engine failed');
    }
    return res.json();
  }

  async submitReview(id: string, data: { notes: string; decision: string; reviewerName?: string }): Promise<EvaluationReport> {
    const res = await fetch(`/api/reports/${id}/review`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit review' }));
      throw new Error(err.error || 'Failed to submit review');
    }
    return res.json();
  }

  async finalizeReport(id: string): Promise<EvaluationReport> {
    const res = await fetch(`/api/reports/${id}/finalize`, {
      method: 'POST',
      headers: this.headers(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to finalize report' }));
      throw new Error(err.error || 'Failed to finalize report');
    }
    return res.json();
  }

  async getRules(): Promise<RegulatoryRuleVersion[]> {
    const res = await fetch('/api/rules', { headers: this.headers() });
    return res.json();
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetch('/api/audit-logs', { headers: this.headers() });
    return res.json();
  }

  async runAutomatedTests() {
    const res = await fetch('/api/automated-tests', { headers: this.headers() });
    return res.json();
  }
}

export const api = new ApiClient();
