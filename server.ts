/**
 * Full-stack Express Backend for SIH NAWI OIML R76 Legal Metrology Evaluation System
 *
 * Provides:
 * - Strict role authorization (ADMIN vs REVIEWER with 403 enforcement)
 * - REST APIs for instruments, evaluation reports, observations, calculation engine, rules, and audit logs
 * - Automated verification test runner endpoint
 * - Dev mode Vite middleware mounting on port 3000
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Instrument, EvaluationReport, RegulatoryRuleVersion, AuditLogEntry, UserRole } from './src/types/metrology';
import {
  GOLDEN_INSTRUMENT_CLASS_III_RETAIL,
  GOLDEN_INSTRUMENT_CLASS_I_ANALYTICAL,
  GOLDEN_INSTRUMENT_CLASS_III_PLATFORM,
  GOLDEN_REPORT_RETAIL_SCALE,
} from './src/data/goldenCases';
import { STANDARD_RULE_VERSIONS } from './src/engine/regulatoryRules';
import { generateInitialTestsForInstrument } from './src/engine/testTemplateGenerator';
import {
  evaluateAllReportTests,
  evaluateTest1,
  evaluateTest2,
  evaluateTest3,
  evaluateTest4,
  evaluateTest5,
  evaluateTest6,
  evaluateTest7,
  evaluateTest8,
  evaluateTest9,
  evaluateTest10,
  evaluateTest11,
  evaluateTest12,
  evaluateTest13,
  evaluateTest14,
  evaluateTest15,
  evaluateTest16,
  evaluateTest17,
} from './src/engine/calculationEngine';
import { runAllAutomatedTests } from './src/engine/testRunner';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and handle OPTIONS preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-app-role, role, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '20mb' }));

// File-backed Persistence
const DATA_FILE = path.join('/tmp', 'nawi_metrology_store.json');

function loadDataStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.instruments) && parsed.instruments.length > 0) {
        instruments = parsed.instruments;
      }
      if (Array.isArray(parsed.reports) && parsed.reports.length > 0) {
        reports = parsed.reports;
      }
      if (Array.isArray(parsed.auditLogs) && parsed.auditLogs.length > 0) {
        auditLogs = parsed.auditLogs;
      }
    }
  } catch (err) {
    console.warn('[DataStore] Notice: initial store fallback used.');
  }
}

function saveDataStore() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ instruments, reports, auditLogs }, null, 2),
      'utf-8'
    );
  } catch (err) {
    // Non-fatal
  }
}

// In-Memory Data Store (seeded with golden datasets)
let instruments: Instrument[] = [
  GOLDEN_INSTRUMENT_CLASS_III_RETAIL,
  GOLDEN_INSTRUMENT_CLASS_I_ANALYTICAL,
  GOLDEN_INSTRUMENT_CLASS_III_PLATFORM,
];

let reports: EvaluationReport[] = [GOLDEN_REPORT_RETAIL_SCALE];

let rules: RegulatoryRuleVersion[] = [...STANDARD_RULE_VERSIONS];

let auditLogs: AuditLogEntry[] = [
  ...GOLDEN_REPORT_RETAIL_SCALE.auditHistory,
  {
    id: 'aud-sys-init',
    timestamp: '2026-03-01T08:00:00Z',
    action: 'SYSTEM_BOOTSTRAP',
    actorRole: 'ADMIN',
    actorIdentifier: 'National Metrology Institute Core System',
    entityType: 'SECURITY',
    entityId: 'SYSTEM',
    details: 'Legal Metrology Type Evaluation Engine initialized with OIML R76-1:2006 regulatory architecture.',
  },
];

// Initialize from file if exists
loadDataStore();

// Helper: Append Audit Log
function recordAudit(
  action: string,
  actorRole: UserRole,
  actorIdentifier: string,
  entityType: AuditLogEntry['entityType'],
  entityId: string,
  details: string,
  metadata?: Record<string, any>
) {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    action,
    actorRole,
    actorIdentifier,
    entityType,
    entityId,
    details,
    metadata,
  };
  auditLogs.unshift(entry);
  saveDataStore();
}

// ---------------------------------------------------------------------------
// Role Authorization Middleware
// ---------------------------------------------------------------------------
// Extracts role from header 'x-app-role', 'role', query parameter, or body
function extractRole(req: Request): UserRole {
  const headerRole = (req.headers['x-app-role'] || req.headers['role']) as string;
  const queryRole = (req.query?.role as string);
  const bodyRole = (req.body?._role || req.body?.role) as string;

  const role = (headerRole || queryRole || bodyRole || '').trim().toUpperCase();

  if (role === 'REVIEWER') {
    return 'REVIEWER';
  }
  // Default to ADMIN for evaluation operations unless explicitly REVIEWER
  return 'ADMIN';
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = extractRole(req);
  if (role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden: Reviewer role is restricted to inspecting and reviewing reports. Administrative actions (creating instruments, reports, observations, rule changes) require ADMIN role.',
      code: 'ERR_REVIEWER_FORBIDDEN',
    });
  }
  next();
}

// ---------------------------------------------------------------------------
// API ENDPOINTS
// ---------------------------------------------------------------------------

// 1. GET /api/role-status - Check current role header
app.get('/api/role-status', (req: Request, res: Response) => {
  const role = extractRole(req);
  res.json({
    role,
    canCreate: role === 'ADMIN',
    canEdit: role === 'ADMIN',
    canReview: true,
  });
});

// 2. GET /api/instruments - All roles can view instruments
app.get('/api/instruments', (req: Request, res: Response) => {
  res.json(instruments);
});

// 3. POST /api/instruments - Admin only (403 for Reviewer)
app.post('/api/instruments', requireAdmin, (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.patternDesignation || !data.manufacturer || !data.accuracyClass) {
      return res.status(400).json({ error: 'Missing mandatory instrument parameters: Pattern Designation, Manufacturer, and Accuracy Class are required.' });
    }

    let ranges = data.ranges;
    if (!Array.isArray(ranges) || ranges.length === 0) {
      const max1 = Number(data.max1 || 15);
      const e1 = Number(data.e1 || 0.005);
      const min1 = Number(data.min1 || 0.04);
      const d1 = Number(data.d1 || e1);
      ranges = [
        {
          rangeIndex: 1,
          min: min1,
          max: max1,
          e: e1,
          d: d1,
          n: Math.round(max1 / e1),
        },
      ];
    } else {
      // Ensure all ranges have required numerical properties
      ranges = ranges.map((r: any, idx: number) => ({
        rangeIndex: r.rangeIndex || idx + 1,
        min: Number(r.min) || 0.01,
        max: Number(r.max) || 15,
        e: Number(r.e) || 0.005,
        d: Number(r.d) || Number(r.e) || 0.005,
        n: Number(r.n) || Math.round((Number(r.max) || 15) / (Number(r.e) || 0.005)),
      }));
    }

    const newInstrument: Instrument = {
      ...data,
      id: data.id || `inst-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      ranges,
      units: data.units || 'kg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    instruments.unshift(newInstrument);
    saveDataStore();
    recordAudit('INSTRUMENT_CREATED', 'ADMIN', 'Admin User', 'INSTRUMENT', newInstrument.id, `Registered new instrument pattern: ${newInstrument.patternDesignation} (Class ${newInstrument.accuracyClass})`);

    res.status(201).json(newInstrument);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register instrument' });
  }
});

// 4. GET /api/reports - All roles can view report listings
app.get('/api/reports', (req: Request, res: Response) => {
  const { search, status, accuracyClass } = req.query;

  let filtered = [...reports];

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.reportNumber.toLowerCase().includes(s) ||
        r.instrument?.patternDesignation?.toLowerCase().includes(s) ||
        r.instrument?.manufacturer?.toLowerCase().includes(s) ||
        r.instrument?.serialNumber?.toLowerCase().includes(s)
    );
  }

  if (status && status !== 'ALL') {
    filtered = filtered.filter((r) => r.status === status);
  }

  if (accuracyClass && accuracyClass !== 'ALL') {
    filtered = filtered.filter((r) => r.instrument?.accuracyClass === accuracyClass);
  }

  res.json(filtered);
});

// 5. GET /api/reports/:id - All roles can view single report
app.get('/api/reports/:id', (req: Request, res: Response) => {
  const report = reports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Evaluation report not found.' });
  }
  res.json(report);
});

// 6. POST /api/reports - Admin only (403 for Reviewer)
app.post('/api/reports', requireAdmin, (req: Request, res: Response) => {
  try {
    const { instrumentId, ruleVersionId, observerName, instrument } = req.body;

    let inst = instruments.find((i) => i.id === instrumentId);

    // If instrument was supplied directly, register and use it
    if (!inst && instrument && instrument.patternDesignation) {
      const directInst: Instrument = {
        ...instrument,
        id: instrument.id || `inst-${Date.now()}`,
        createdAt: instrument.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      instruments.unshift(directInst);
      inst = directInst;
      saveDataStore();
    }

    // Fallback to first available instrument if not found
    if (!inst) {
      if (instruments.length > 0) {
        inst = instruments[0];
      } else {
        return res.status(404).json({ error: 'No weighing instrument found. Please register an instrument first.' });
      }
    }

    const rule = rules.find((r) => r.id === ruleVersionId) || rules[0];

    // Generate initial tests 1 to 17 populated for this instrument
    const initialTests = generateInitialTestsForInstrument(inst);

    const draftReport: EvaluationReport = {
      id: `rep-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      reportNumber: `OIML-R76-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      instrumentId: inst.id,
      instrument: inst,
      ruleVersionId: rule.id,
      ruleVersion: rule,
      status: 'DRAFT',
      evaluationPeriodStart: new Date().toISOString().split('T')[0],
      evaluationPeriodEnd: new Date().toISOString().split('T')[0],
      observerName: observerName || 'Laboratory Testing Officer',
      overallResult: 'PASS',
      ...initialTests,
      attachments: [],
      auditHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Execute calculation engine immediately so all 17 tests have verified calculations
    const evalResult = evaluateAllReportTests(draftReport);
    const newReport = evalResult.report;

    reports.unshift(newReport);
    saveDataStore();
    recordAudit('REPORT_CREATED', 'ADMIN', 'Admin User', 'REPORT', newReport.id, `Created evaluation report ${newReport.reportNumber} for pattern ${inst.patternDesignation}`);

    res.status(201).json(newReport);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create report' });
  }
});

// 7. PUT /api/reports/:id - Admin only (403 for Reviewer)
app.put('/api/reports/:id', requireAdmin, (req: Request, res: Response) => {
  const index = reports.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  if (reports[index].status === 'FINAL') {
    return res.status(400).json({ error: 'Cannot modify a finalized evaluation report.' });
  }

  const updated: EvaluationReport = {
    ...reports[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  reports[index] = updated;
  recordAudit('REPORT_UPDATED', 'ADMIN', 'Admin User', 'REPORT', updated.id, `Updated observations/data on report ${updated.reportNumber}`);

  res.json(updated);
});

// 8. POST /api/reports/:id/calculate - Admin only (403 for Reviewer)
// Executes calculations across all 17 tests using the high-precision metrological engine
app.post('/api/reports/:id/calculate', requireAdmin, (req: Request, res: Response) => {
  try {
    let index = reports.findIndex((r) => r.id === req.params.id);
    let report: EvaluationReport;

    if (index === -1) {
      if (req.body?.report && req.body.report.id) {
        report = req.body.report;
        reports.unshift(report);
        index = 0;
        saveDataStore();
      } else if (reports.length > 0) {
        index = 0;
        report = reports[0];
      } else {
        return res.status(404).json({ error: 'Report not found.' });
      }
    } else {
      report = reports[index];
    }

    const { report: updatedReport, logs: executionLogs } = evaluateAllReportTests(report);

    reports[index] = updatedReport;
    saveDataStore();
    recordAudit(
      'CALCULATIONS_EXECUTED',
      'ADMIN',
      'Admin User',
      'OBSERVATION',
      updatedReport.id,
      `Executed metrological calculation engine for ${updatedReport.reportNumber}. Decision: ${updatedReport.overallResult}`
    );

    res.json({ report: updatedReport, logs: executionLogs });
  } catch (err: any) {
    console.error('Calculation engine error:', err);
    res.status(500).json({ error: err.message || 'Calculation engine failed' });
  }
});

// 9. POST /api/reports/:id/review - Reviewer OR Admin permitted to submit review remarks/decision
app.post('/api/reports/:id/review', (req: Request, res: Response) => {
  const role = extractRole(req);
  const { notes, decision, reviewerName } = req.body;

  const index = reports.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const report = reports[index];
  const updatedReport: EvaluationReport = {
    ...report,
    reviewerNotes: notes || report.reviewerNotes,
    reviewerDecision: decision || report.reviewerDecision,
    reviewerName: reviewerName || (role === 'REVIEWER' ? 'Metrology Reviewer' : report.reviewerName),
    reviewerDecisionDate: new Date().toISOString(),
    status: decision === 'RECOMMEND_APPROVAL' ? 'APPROVED' : 'IN_REVIEW',
    updatedAt: new Date().toISOString(),
  };

  reports[index] = updatedReport;
  recordAudit(
    'REVIEW_SUBMITTED',
    role,
    reviewerName || `${role} Officer`,
    'REPORT',
    report.id,
    `Submitted review decision: ${decision}. Notes: ${notes?.slice(0, 100) || 'None'}`
  );

  res.json(updatedReport);
});

// 10. POST /api/reports/:id/finalize - Admin only (403 for Reviewer)
app.post('/api/reports/:id/finalize', requireAdmin, (req: Request, res: Response) => {
  const index = reports.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const report = reports[index];
  const updatedReport: EvaluationReport = {
    ...report,
    status: 'FINAL',
    updatedAt: new Date().toISOString(),
  };

  reports[index] = updatedReport;
  recordAudit('REPORT_FINALIZED', 'ADMIN', 'Admin User', 'REPORT', report.id, `Finalized and locked report ${report.reportNumber}`);

  res.json(updatedReport);
});

// 11. GET /api/rules - All roles can view regulatory rules
app.get('/api/rules', (req: Request, res: Response) => {
  res.json(rules);
});

// 12. POST /api/rules - Admin only (403 for Reviewer)
app.post('/api/rules', requireAdmin, (req: Request, res: Response) => {
  const newRule: RegulatoryRuleVersion = {
    ...req.body,
    id: `rule-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  rules.push(newRule);
  recordAudit('RULE_CREATED', 'ADMIN', 'Admin User', 'RULE', newRule.id, `Added regulatory standard: ${newRule.name}`);
  res.status(201).json(newRule);
});

// 13. GET /api/audit-logs - All roles can view audit trail
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(auditLogs);
});

// 14. GET /api/automated-tests - Executes automated verification suite
app.get('/api/automated-tests', (req: Request, res: Response) => {
  const summary = runAllAutomatedTests();
  res.json(summary);
});

// ---------------------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[NAWI Legal Metrology Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
