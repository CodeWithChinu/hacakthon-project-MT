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
import {
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

app.use(express.json({ limit: '20mb' }));

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
}

// ---------------------------------------------------------------------------
// Role Authorization Middleware
// ---------------------------------------------------------------------------
// Extracts role from header 'x-app-role' (defaulting to 'REVIEWER' for security)
function extractRole(req: Request): UserRole {
  const headerRole = req.headers['x-app-role'] as string;
  if (headerRole === 'ADMIN') return 'ADMIN';
  return 'REVIEWER';
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
  const data = req.body;
  if (!data.patternDesignation || !data.manufacturer || !data.accuracyClass || !data.ranges) {
    return res.status(400).json({ error: 'Missing mandatory instrument parameters.' });
  }

  const newInstrument: Instrument = {
    ...data,
    id: data.id || `inst-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  instruments.unshift(newInstrument);
  recordAudit('INSTRUMENT_CREATED', 'ADMIN', 'Admin User', 'INSTRUMENT', newInstrument.id, `Registered new instrument pattern: ${newInstrument.patternDesignation} (Class ${newInstrument.accuracyClass})`);

  res.status(201).json(newInstrument);
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
        r.instrument.patternDesignation.toLowerCase().includes(s) ||
        r.instrument.manufacturer.toLowerCase().includes(s) ||
        r.instrument.serialNumber.toLowerCase().includes(s)
    );
  }

  if (status && status !== 'ALL') {
    filtered = filtered.filter((r) => r.status === status);
  }

  if (accuracyClass && accuracyClass !== 'ALL') {
    filtered = filtered.filter((r) => r.instrument.accuracyClass === accuracyClass);
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
  const { instrumentId, ruleVersionId, observerName } = req.body;

  const inst = instruments.find((i) => i.id === instrumentId);
  if (!inst) {
    return res.status(404).json({ error: 'Instrument not found.' });
  }

  const rule = rules.find((r) => r.id === ruleVersionId) || rules[0];

  const newReport: EvaluationReport = {
    id: `rep-${Date.now()}`,
    reportNumber: `OIML-R76-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    instrumentId: inst.id,
    instrument: inst,
    ruleVersionId: rule.id,
    ruleVersion: rule,
    status: 'DRAFT',
    evaluationPeriodStart: new Date().toISOString().split('T')[0],
    evaluationPeriodEnd: new Date().toISOString().split('T')[0],
    observerName: observerName || 'Laboratory Testing Officer',
    overallResult: 'INCOMPLETE',
    attachments: [],
    auditHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  reports.unshift(newReport);
  recordAudit('REPORT_CREATED', 'ADMIN', 'Admin User', 'REPORT', newReport.id, `Created evaluation report ${newReport.reportNumber} for pattern ${inst.patternDesignation}`);

  res.status(201).json(newReport);
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
  const index = reports.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const report = reports[index];
  const inst = report.instrument;
  const executionLogs: string[] = [];

  // Evaluate tests if data present
  let test1 = report.test1;
  if (test1) {
    const res1 = evaluateTest1(test1, inst);
    test1 = res1.processedData;
    executionLogs.push(...res1.calculationLog);
  }

  let test2 = report.test2;
  if (test2) {
    const res2 = evaluateTest2(test2, inst);
    test2 = res2.processedData;
    executionLogs.push(...res2.calculationLog);
  }

  let test3 = report.test3;
  if (test3) {
    const res3 = evaluateTest3(test3, inst);
    test3 = res3.processedData;
    executionLogs.push(...res3.calculationLog);
  }

  let test4 = report.test4;
  if (test4) {
    const res4 = evaluateTest4(test4, inst);
    test4 = res4.processedData;
    executionLogs.push(...res4.calculationLog);
  }

  let test5 = report.test5;
  if (test5) {
    const res5 = evaluateTest5(test5, inst);
    test5 = res5.processedData;
    executionLogs.push(...res5.calculationLog);
  }

  let test6 = report.test6;
  if (test6) {
    const res6 = evaluateTest6(test6, inst);
    test6 = res6.processedData;
    executionLogs.push(...res6.calculationLog);
  }

  let test7 = report.test7;
  if (test7) {
    const res7 = evaluateTest7(test7, inst);
    test7 = res7.processedData;
    executionLogs.push(...res7.calculationLog);
  }

  let test8 = report.test8;
  if (test8) {
    const res8 = evaluateTest8(test8, inst);
    test8 = res8.processedData;
    executionLogs.push(...res8.calculationLog);
  }

  let test9 = report.test9;
  if (test9) {
    const res9 = evaluateTest9(test9, inst);
    test9 = res9.processedData;
    executionLogs.push(...res9.calculationLog);
  }

  let test10 = report.test10;
  if (test10) {
    const res10 = evaluateTest10(test10, inst);
    test10 = res10.processedData;
    executionLogs.push(...res10.calculationLog);
  }

  let test11 = report.test11;
  if (test11) {
    const res11 = evaluateTest11(test11, inst);
    test11 = res11.processedData;
    executionLogs.push(...res11.calculationLog);
  }

  let test12 = report.test12;
  if (test12) {
    const res12 = evaluateTest12(test12, inst);
    test12 = res12.processedData;
    executionLogs.push(...res12.calculationLog);
  }

  let test13 = report.test13;
  if (test13) {
    const res13 = evaluateTest13(test13, inst);
    test13 = res13.processedData;
    executionLogs.push(...res13.calculationLog);
  }

  let test14 = report.test14;
  if (test14) {
    const res14 = evaluateTest14(test14, inst);
    test14 = res14.processedData;
    executionLogs.push(...res14.calculationLog);
  }

  let test15 = report.test15;
  if (test15) {
    const res15 = evaluateTest15(test15, inst);
    test15 = res15.processedData;
    executionLogs.push(...res15.calculationLog);
  }

  let test16 = report.test16;
  if (test16) {
    const res16 = evaluateTest16(test16);
    test16 = res16.processedData;
    executionLogs.push(...res16.calculationLog);
  }

  let test17 = report.test17;
  if (test17) {
    const res17 = evaluateTest17(test17);
    test17 = res17.processedData;
    executionLogs.push(...res17.calculationLog);
  }

  // Determine overall compliance result across all 17 tests
  const testResults = [
    test1?.overallResult,
    test2?.overallResult,
    test3?.overallResult,
    test4?.overallResult,
    test5?.overallResult,
    test6?.overallResult,
    test7?.overallResult,
    test8?.overallResult,
    test9?.overallResult,
    test10?.overallResult,
    test11?.overallResult,
    test12?.overallResult,
    test13?.overallResult,
    test14?.overallResult,
    test15?.overallResult,
    test16?.overallResult,
    test17?.overallResult,
  ].filter(Boolean);

  let overallResult = report.overallResult;
  if (testResults.includes('FAIL')) {
    overallResult = 'FAIL';
  } else if (testResults.includes('INCOMPLETE') || testResults.length < 17) {
    overallResult = 'INCOMPLETE';
  } else if (testResults.every((r) => r === 'PASS' || r === 'NOT_APPLICABLE')) {
    overallResult = 'PASS';
  }

  const updatedReport: EvaluationReport = {
    ...report,
    test1,
    test2,
    test3,
    test4,
    test5,
    test6,
    test7,
    test8,
    test9,
    test10,
    test11,
    test12,
    test13,
    test14,
    test15,
    test16,
    test17,
    overallResult,
    status: overallResult === 'PASS' ? 'COMPLETED' : report.status,
    updatedAt: new Date().toISOString(),
  };

  reports[index] = updatedReport;
  recordAudit('CALCULATIONS_EXECUTED', 'ADMIN', 'Admin User', 'OBSERVATION', updatedReport.id, `Executed metrological calculation engine for ${updatedReport.reportNumber}. Decision: ${overallResult}`);

  res.json({ report: updatedReport, logs: executionLogs });
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
