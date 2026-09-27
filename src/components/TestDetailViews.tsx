/**
 * Metrological Test Views & Observation Tables for Tests 1 through 17
 * Strict adherence to OIML R 76-1:2006 and R 76-2:2007 forms and mathematical formulas.
 */

import React, { useState } from 'react';
import { EvaluationReport, UserRole, ResultState } from '../types/metrology';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  Calculator,
  Info,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

interface Props {
  report: EvaluationReport;
  role: UserRole;
  onUpdateReport: (updates: Partial<EvaluationReport>) => Promise<void>;
  onRunCalculations: () => Promise<void>;
}

export const TestDetailViews: React.FC<Props> = ({
  report,
  role,
  onUpdateReport,
  onRunCalculations,
}) => {
  const [activeTestNum, setActiveTestNum] = useState<number>(1);
  const [calculating, setCalculating] = useState(false);
  const isAdmin = role === 'ADMIN';
  const inst = report.instrument;

  const handleRunCalcs = async () => {
    try {
      setCalculating(true);
      await onRunCalculations();
    } finally {
      setCalculating(false);
    }
  };

  const getBadge = (state: ResultState | undefined) => {
    if (state === 'PASS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-700">
          <CheckCircle2 className="w-3 h-3" /> PASS
        </span>
      );
    }
    if (state === 'FAIL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-950/80 text-rose-400 border border-rose-700">
          <XCircle className="w-3 h-3" /> FAIL
        </span>
      );
    }
    if (state === 'NOT_APPLICABLE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
          <MinusCircle className="w-3 h-3" /> NOT APPLICABLE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950/80 text-amber-400 border border-amber-700">
        <Clock className="w-3 h-3" /> INCOMPLETE
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Test Selection Tabs Bar */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((num) => {
            const testKey = `test${num}` as keyof EvaluationReport;
            const testObj = report[testKey] as any;
            const res = testObj?.overallResult as ResultState | undefined;

            return (
              <button
                key={num}
                type="button"
                onClick={() => setActiveTestNum(num)}
                className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTestNum === num
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <span>T{num}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    res === 'PASS'
                      ? 'bg-emerald-400'
                      : res === 'FAIL'
                      ? 'bg-rose-400'
                      : res === 'NOT_APPLICABLE'
                      ? 'bg-slate-500'
                      : 'bg-amber-400'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Action Button: Run Metrological Calculations */}
        {isAdmin && (
          <button
            type="button"
            onClick={handleRunCalcs}
            disabled={calculating}
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Calculator className="w-3.5 h-3.5" />
            {calculating ? 'Executing Engine...' : 'Run Calculation Engine'}
          </button>
        )}
      </div>

      {/* Test View Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        {/* TEST 1: WEIGHING PERFORMANCE */}
        {activeTestNum === 1 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.4.4 / A.5.3.1
                </div>
                <h3 className="text-base font-bold text-white">
                  Test 1 — Weighing Performance (Calculation of Error)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Formula: Conventional true value <span className="font-mono text-slate-200">P = I + e/2 − ΔL</span>, Error <span className="font-mono text-slate-200">E = P − L</span>, Corrected error <span className="font-mono text-slate-200">Ec = E − E0</span>. Evaluated against Table 6 MPE.
                </p>
              </div>
              {getBadge(report.test1?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Load (L)</th>
                    <th className="py-2 px-3">Dir</th>
                    <th className="py-2 px-3">Indication (I)</th>
                    <th className="py-2 px-3">ΔL</th>
                    <th className="py-2 px-3">P (True)</th>
                    <th className="py-2 px-3">Error (E)</th>
                    <th className="py-2 px-3">Corr. Ec</th>
                    <th className="py-2 px-3">MPE</th>
                    <th className="py-2 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test1?.observations.map((obs, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-200 font-semibold">{obs.load} {inst.units}</td>
                      <td className="py-2 px-3 text-slate-400">{obs.direction}</td>
                      <td className="py-2 px-3 text-slate-300">{obs.indication} {inst.units}</td>
                      <td className="py-2 px-3 text-slate-400">{obs.deltaL} {inst.units}</td>
                      <td className="py-2 px-3 text-blue-300">{obs.p?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-slate-300">{obs.error?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 font-bold text-white">{obs.correctedError?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-amber-300">±{obs.mpe?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-center">
                        {obs.pass ? (
                          <span className="text-emerald-400 font-bold">PASS</span>
                        ) : (
                          <span className="text-rose-400 font-bold">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-slate-400 font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
              Remarks: {report.test1?.remarks || 'Weighing performance fully verified across all intervals.'}
            </div>
          </div>
        )}

        {/* TEST 2: TEMPERATURE EFFECT */}
        {activeTestNum === 2 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.5.3.2
                </div>
                <h3 className="text-base font-bold text-white">
                  Test 2 — Temperature Effect on No-Load Indication
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  For consecutive temperatures: Class I: <span className="font-mono text-slate-200">|ΔP| / |ΔT| ≤ e</span> per 1 °C. Classes II, III, IIII: <span className="font-mono text-slate-200">|ΔP| × 5 / |ΔT| ≤ e</span> (zero-change per 5 °C ≤ e).
                </p>
              </div>
              {getBadge(report.test2?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Temp (°C)</th>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Zero Indication</th>
                    <th className="py-2 px-3">ΔL</th>
                    <th className="py-2 px-3">P</th>
                    <th className="py-2 px-3">ΔP</th>
                    <th className="py-2 px-3">ΔTemp</th>
                    <th className="py-2 px-3">Metric / 5°C</th>
                    <th className="py-2 px-3">Limit (e)</th>
                    <th className="py-2 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test2?.points.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-white font-bold">{pt.temperature} °C</td>
                      <td className="py-2 px-3 text-slate-400">{pt.time}</td>
                      <td className="py-2 px-3 text-slate-300">{pt.zeroIndication}</td>
                      <td className="py-2 px-3 text-slate-400">{pt.deltaL}</td>
                      <td className="py-2 px-3 text-blue-300">{pt.p?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-slate-300">{pt.deltaP?.toFixed(4) || '0'}</td>
                      <td className="py-2 px-3 text-slate-300">{pt.deltaT || '0'} °C</td>
                      <td className="py-2 px-3 font-semibold text-white">{pt.zeroChangePerRefTemp?.toFixed(6) || '—'}</td>
                      <td className="py-2 px-3 text-amber-300">{pt.limit} {inst.units}</td>
                      <td className="py-2 px-3 text-center">
                        {pt.pass ? (
                          <span className="text-emerald-400 font-bold">PASS</span>
                        ) : (
                          <span className="text-rose-400 font-bold">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 3: ECCENTRICITY */}
        {activeTestNum === 3 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.4.7
                </div>
                <h3 className="text-base font-bold text-white">Test 3 — Eccentricity</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Prescribed Load = (Max + Tare)/3 = <span className="font-mono text-white font-bold">{report.test3?.calculatedLoad || '—'} {inst.units}</span>. Evaluated independently at each position.
                </p>
              </div>
              {getBadge(report.test3?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Position</th>
                    <th className="py-2 px-3">Load (L)</th>
                    <th className="py-2 px-3">Indication (I)</th>
                    <th className="py-2 px-3">ΔL</th>
                    <th className="py-2 px-3">E0</th>
                    <th className="py-2 px-3">Corr. Error Ec</th>
                    <th className="py-2 px-3">MPE</th>
                    <th className="py-2 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test3?.weightPositions.map((pos) => (
                    <tr key={pos.positionNumber} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">Pos {pos.positionNumber} ({pos.positionName})</td>
                      <td className="py-2 px-3 text-slate-300">{pos.load} {inst.units}</td>
                      <td className="py-2 px-3 text-slate-300">{pos.indication} {inst.units}</td>
                      <td className="py-2 px-3 text-slate-400">{pos.deltaL}</td>
                      <td className="py-2 px-3 text-slate-400">{pos.e0}</td>
                      <td className="py-2 px-3 font-bold text-white">{pos.correctedError?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-amber-300">±{pos.mpe?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-center">
                        {pos.pass ? (
                          <span className="text-emerald-400 font-bold">PASS</span>
                        ) : (
                          <span className="text-rose-400 font-bold">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 4: DISCRIMINATION & SENSITIVITY */}
        {activeTestNum === 4 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.4.8 / A.4.9
                </div>
                <h3 className="text-base font-bold text-white">Test 4 — Discrimination and Sensitivity</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Digital indication: Extra load = 1.4 d. Indication change <span className="font-mono text-slate-200">I2 − I1 ≥ d</span>.
                </p>
              </div>
              {getBadge(report.test4?.overallResult)}
            </div>

            {report.test4?.digitalRows && (
              <div className="overflow-x-auto border border-slate-800 rounded">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Load (L)</th>
                      <th className="py-2 px-3">Indication 1 (I1)</th>
                      <th className="py-2 px-3">Extra Load (1.4d)</th>
                      <th className="py-2 px-3">Indication 2 (I2)</th>
                      <th className="py-2 px-3">Difference (I2 - I1)</th>
                      <th className="py-2 px-3">Requirement (d)</th>
                      <th className="py-2 px-3 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {report.test4.digitalRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-white font-semibold">{r.load} {inst.units}</td>
                        <td className="py-2 px-3 text-slate-300">{r.indication1}</td>
                        <td className="py-2 px-3 text-slate-400">{r.extraLoad}</td>
                        <td className="py-2 px-3 text-slate-300">{r.indication2}</td>
                        <td className="py-2 px-3 text-blue-300 font-bold">{r.difference?.toFixed(4) || '—'}</td>
                        <td className="py-2 px-3 text-amber-300">≥ {r.requiredD}</td>
                        <td className="py-2 px-3 text-center">
                          {r.pass ? (
                            <span className="text-emerald-400 font-bold">PASS</span>
                          ) : (
                            <span className="text-rose-400 font-bold">FAIL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TEST 5: REPEATABILITY */}
        {activeTestNum === 5 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.4.10
                </div>
                <h3 className="text-base font-bold text-white">Test 5 — Repeatability</h3>
                <p className="text-xs text-slate-400 mt-1">
                  10 weighings at ~50% Max and ~100% Max. Acceptance: every individual |Ei| ≤ |MPE| AND <span className="font-mono text-slate-200">R = Emax − Emin ≤ |MPE|</span>.
                </p>
              </div>
              {getBadge(report.test5?.overallResult)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Series 50% */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="font-mono text-xs font-bold text-blue-400 mb-2">
                  SERIES 1: Around 50% Max ({report.test5?.series50.loadNominal} {inst.units})
                </div>
                <div className="text-[11px] font-mono space-y-1 text-slate-300">
                  <div>Pmax: {report.test5?.series50.pMax?.toFixed(4)}</div>
                  <div>Pmin: {report.test5?.series50.pMin?.toFixed(4)}</div>
                  <div className="font-bold text-white">
                    Range R (Pmax - Pmin): {report.test5?.series50.rangeR?.toFixed(4)} {inst.units}
                  </div>
                  <div className="text-amber-400">MPE: ±{report.test5?.series50.mpe?.toFixed(4)} {inst.units}</div>
                  <div className="pt-1 font-bold">
                    Result: {report.test5?.series50.rangePass ? <span className="text-emerald-400">PASS</span> : <span className="text-rose-400">FAIL</span>}
                  </div>
                </div>
              </div>

              {/* Series 100% */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="font-mono text-xs font-bold text-blue-400 mb-2">
                  SERIES 2: Close to 100% Max ({report.test5?.series100.loadNominal} {inst.units})
                </div>
                <div className="text-[11px] font-mono space-y-1 text-slate-300">
                  <div>Pmax: {report.test5?.series100.pMax?.toFixed(4)}</div>
                  <div>Pmin: {report.test5?.series100.pMin?.toFixed(4)}</div>
                  <div className="font-bold text-white">
                    Range R (Pmax - Pmin): {report.test5?.series100.rangeR?.toFixed(4)} {inst.units}
                  </div>
                  <div className="text-amber-400">MPE: ±{report.test5?.series100.mpe?.toFixed(4)} {inst.units}</div>
                  <div className="pt-1 font-bold">
                    Result: {report.test5?.series100.rangePass ? <span className="text-emerald-400">PASS</span> : <span className="text-rose-400">FAIL</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST 6: TIME DEPENDENCE */}
        {activeTestNum === 6 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.4.11
                </div>
                <h3 className="text-base font-bold text-white">Test 6 — Time-Dependence (Zero Return &amp; Creep)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  6.1 Zero Return: <span className="font-mono text-slate-200">D_ZR = |P30 − P0| ≤ 0.5e</span>. 6.2 Creep: |ΔP(30)| ≤ 0.5e and variation between 15 and 30 min ≤ 0.2e.
                </p>
              </div>
              {getBadge(report.test6?.overallResult)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono">
                <div className="font-bold text-blue-400 mb-2">6.1 Zero Return Observation</div>
                <div className="space-y-1 text-slate-300">
                  <div>P0 (before loading): {report.test6?.p0?.toFixed(4)}</div>
                  <div>P30 (30 min after unload): {report.test6?.p30?.toFixed(4)}</div>
                  <div className="font-bold text-white">|P30 - P0| = {report.test6?.deltaZeroReturn?.toFixed(4)} {inst.units}</div>
                  <div className="text-amber-400">Limit (0.5 e): {report.test6?.limitZeroReturn?.toFixed(4)} {inst.units}</div>
                  <div className="pt-1">
                    Zero Return Result: {report.test6?.zeroReturnPass ? <span className="text-emerald-400 font-bold">PASS</span> : <span className="text-rose-400 font-bold">FAIL</span>}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono">
                <div className="font-bold text-blue-400 mb-2">6.2 Creep Observations</div>
                <div className="space-y-1 text-slate-300">
                  {report.test6?.creepReadings.map((cr, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{cr.timeMinutes} min:</span>
                      <span>P = {cr.p?.toFixed(4)} (ΔP = {cr.deltaP?.toFixed(4)})</span>
                    </div>
                  ))}
                  <div className="pt-2 text-white font-bold">
                    Creep Status: {report.test6?.creepTerminatedAt30Min ? 'Terminated at 30 min (conforms)' : 'Evaluated to 4h'}
                  </div>
                  <div>
                    Creep Result: {report.test6?.creepPass ? <span className="text-emerald-400 font-bold">PASS</span> : <span className="text-rose-400 font-bold">FAIL</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST 7: STABILITY OF EQUILIBRIUM */}
        {activeTestNum === 7 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.4.12
                </div>
                <h3 className="text-base font-bold text-white">Test 7 — Stability of Equilibrium</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Printing stability: range of readings 5s after command <span className="font-mono text-slate-200">D_stab ≤ e</span>. Zero setting under disturbed equilibrium: error ≤ 0.25e.
                </p>
              </div>
              {getBadge(report.test7?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Repetition #</th>
                    <th className="py-2 px-3">Printed Value</th>
                    <th className="py-2 px-3">Min during 5s</th>
                    <th className="py-2 px-3">Max during 5s</th>
                    <th className="py-2 px-3">D_stab (Max - Min)</th>
                    <th className="py-2 px-3 text-center">Result (≤ e)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test7?.printingTests.map((pt) => (
                    <tr key={pt.repetition} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">Repetition #{pt.repetition}</td>
                      <td className="py-2 px-3 text-blue-300">{pt.printedValue} {inst.units}</td>
                      <td className="py-2 px-3 text-slate-300">{pt.minDuring5s}</td>
                      <td className="py-2 px-3 text-slate-300">{pt.maxDuring5s}</td>
                      <td className="py-2 px-3 font-bold text-white">{pt.dStab?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-center">
                        {pt.pass ? (
                          <span className="text-emerald-400 font-bold">PASS</span>
                        ) : (
                          <span className="text-rose-400 font-bold">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 8: TILTING */}
        {activeTestNum === 8 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.5.1, 2 and 3
                </div>
                <h3 className="text-base font-bold text-white">Test 8 — Tilting</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tested in 4 directions: Longitudinal +, Longitudinal −, Transverse +, Transverse −. No-load condition: <span className="font-mono text-slate-200">|E0tilt − E0ref| ≤ 2e</span>. Loaded: <span className="font-mono text-slate-200">Dtilt ≤ MPE</span>.
                </p>
              </div>
              {getBadge(report.test8?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Direction</th>
                    <th className="py-2 px-3">Tilt</th>
                    <th className="py-2 px-3">E0</th>
                    <th className="py-2 px-3">|E0 - Ref| (≤ 2e)</th>
                    <th className="py-2 px-3">Ec Load 1</th>
                    <th className="py-2 px-3">Ec Load 2 (Max)</th>
                    <th className="py-2 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test8?.measurements.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">{m.direction}</td>
                      <td className="py-2 px-3 text-slate-400">{m.tiltAmount}</td>
                      <td className="py-2 px-3 text-slate-300">{m.e0?.toFixed(4)}</td>
                      <td className="py-2 px-3 text-blue-300">{m.deltaE0VsRef?.toFixed(4)}</td>
                      <td className="py-2 px-3 text-slate-200">{m.ec1?.toFixed(4)}</td>
                      <td className="py-2 px-3 font-bold text-white">{m.ec2?.toFixed(4)}</td>
                      <td className="py-2 px-3 text-center">
                        {m.noLoadPass && m.loadedPass1 && m.loadedPass2 ? (
                          <span className="text-emerald-400 font-bold">PASS</span>
                        ) : (
                          <span className="text-rose-400 font-bold">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 9: TARE */}
        {activeTestNum === 9 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.4.6.1
                </div>
                <h3 className="text-base font-bold text-white">Test 9 — Tare (Weighing Test)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Subtractive / Additive tare values evaluated across net-load steps. CRITICAL: <span className="font-mono text-amber-300 font-bold">MPE is determined based on NET LOAD</span>, not gross load.
                </p>
              </div>
              {getBadge(report.test9?.overallResult)}
            </div>

            {report.test9?.tareSteps.map((step, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                <div className="font-mono text-xs font-bold text-blue-400">
                  Tare Step #{idx + 1}: Tare = {step.tareValue} {inst.units} ({step.tareType})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 font-mono text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-3">Net Load (L_net)</th>
                        <th className="py-1.5 px-3">Indication (I)</th>
                        <th className="py-1.5 px-3">ΔL</th>
                        <th className="py-1.5 px-3">Corr. Error Ec</th>
                        <th className="py-1.5 px-3">MPE (Net)</th>
                        <th className="py-1.5 px-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {step.netLoadSteps.map((ns, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-3 font-semibold text-white">{ns.netLoadL} {inst.units}</td>
                          <td className="py-1.5 px-3 text-slate-300">{ns.indicationI}</td>
                          <td className="py-1.5 px-3 text-slate-400">{ns.deltaL}</td>
                          <td className="py-1.5 px-3 text-blue-300 font-bold">{ns.correctedErrorEc?.toFixed(4) || '—'}</td>
                          <td className="py-1.5 px-3 text-amber-400">±{ns.mpeNet?.toFixed(4) || '—'}</td>
                          <td className="py-1.5 px-3 text-center">
                            {ns.pass ? (
                              <span className="text-emerald-400 font-bold">PASS</span>
                            ) : (
                              <span className="text-rose-400 font-bold">FAIL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TEST 10: WARM-UP */}
        {activeTestNum === 10 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.5.2
                </div>
                <h3 className="text-base font-bold text-white">Test 10 — Warm-Up Time</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Instrument disconnected for ≥ 8 hours ({report.test10?.disconnectionDurationHours} h recorded). Acceptance: <span className="font-mono text-slate-200">|EL − E0| ≤ MPE</span> at 0, 5, 15, 30 min.
                </p>
              </div>
              {getBadge(report.test10?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Load</th>
                    <th className="py-2 px-3">E0 (Zero)</th>
                    <th className="py-2 px-3">EL (Loaded)</th>
                    <th className="py-2 px-3">|EL - E0|</th>
                    <th className="py-2 px-3">MPE</th>
                    <th className="py-2 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test10?.measurements.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">{m.timeMinutes} min</td>
                      <td className="py-2 px-3 text-slate-400">{m.loadNominal} {inst.units}</td>
                      <td className="py-2 px-3 text-slate-300">{m.errorZeroE0?.toFixed(4)}</td>
                      <td className="py-2 px-3 text-slate-300">{m.errorLoadedEL?.toFixed(4)}</td>
                      <td className="py-2 px-3 font-bold text-blue-300">{m.correctedError?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-amber-300">±{m.mpe?.toFixed(4)}</td>
                      <td className="py-2 px-3 text-center">
                        {m.pass ? (
                          <span className="text-emerald-400 font-bold">PASS</span>
                        ) : (
                          <span className="text-rose-400 font-bold">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 11: VOLTAGE VARIATIONS */}
        {activeTestNum === 11 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.5.4
                </div>
                <h3 className="text-base font-bold text-white">Test 11 — Variations of Voltage</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Power Category: <span className="font-mono text-slate-200">{report.test11?.powerCategory}</span> (Unom = {report.test11?.nominalVoltage} V). Tested at 10e and ~Max loads.
                </p>
              </div>
              {getBadge(report.test11?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Condition</th>
                    <th className="py-2 px-3">Voltage</th>
                    <th className="py-2 px-3">Load</th>
                    <th className="py-2 px-3">Indication</th>
                    <th className="py-2 px-3">Corr. Error Ec</th>
                    <th className="py-2 px-3">MPE</th>
                    <th className="py-2 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test11?.rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">{r.conditionLabel}</td>
                      <td className="py-2 px-3 text-slate-300">{r.voltage} V</td>
                      <td className="py-2 px-3 text-slate-400">{r.load} {inst.units}</td>
                      <td className="py-2 px-3 text-slate-300">{r.indication}</td>
                      <td className="py-2 px-3 font-bold text-blue-300">{r.correctedErrorEc?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-amber-300">±{r.mpe?.toFixed(4) || '—'}</td>
                      <td className="py-2 px-3 text-center">
                        {r.pass ? (
                          <span className="text-emerald-400 font-bold">PASS</span>
                        ) : (
                          <span className="text-rose-400 font-bold">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 12: ELECTRICAL DISTURBANCES / EMC */}
        {activeTestNum === 12 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Annex B.3 (EMC)
                </div>
                <h3 className="text-base font-bold text-white">Test 12 — Electrical Disturbances / Immunity</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Criterion: <span className="font-mono text-slate-200">|Id − I0| ≤ e</span> OR significant fault (&gt; e) detected with proper alarm and transmission inhibition.
                </p>
              </div>
              {getBadge(report.test12?.overallResult)}
            </div>

            <div className="space-y-3">
              {[
                { title: 'Voltage Dips and Short Interruptions', rows: report.test12?.shortTimePowerReductions },
                { title: 'Electrical Fast Transients / Bursts', rows: report.test12?.electricalBursts },
                { title: 'Electrostatic Discharges (ESD)', rows: report.test12?.electrostaticDischarges },
                { title: 'Radiated Electromagnetic Fields (RF)', rows: report.test12?.radiatedFields },
              ].map(
                (grp, gi) =>
                  grp.rows && (
                    <div key={gi} className="bg-slate-950 p-3 rounded border border-slate-800">
                      <div className="font-mono text-xs font-bold text-blue-400 mb-2">{grp.title}</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-900 font-mono text-slate-400 uppercase border-b border-slate-800">
                            <tr>
                              <th className="py-1 px-2.5">Subtest Condition</th>
                              <th className="py-1 px-2.5">I0 (Ref)</th>
                              <th className="py-1 px-2.5">Id (Disturbed)</th>
                              <th className="py-1 px-2.5">|Id - I0|</th>
                              <th className="py-1 px-2.5">Limit (e)</th>
                              <th className="py-1 px-2.5">Sig. Fault Handled</th>
                              <th className="py-1 px-2.5 text-center">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-mono">
                            {grp.rows.map((r, ri) => (
                              <tr key={ri}>
                                <td className="py-1.5 px-2.5 font-semibold text-white">{r.subtestName}</td>
                                <td className="py-1.5 px-2.5 text-slate-400">{r.referenceIndicationI0}</td>
                                <td className="py-1.5 px-2.5 text-slate-300">{r.disturbedIndicationId}</td>
                                <td className="py-1.5 px-2.5 font-bold text-blue-300">{r.disturbanceError?.toFixed(4) || '—'}</td>
                                <td className="py-1.5 px-2.5 text-amber-400">{r.eLimit}</td>
                                <td className="py-1.5 px-2.5 text-slate-300">{r.significantFaultDetected ? 'Yes (Alarm)' : 'No (>e absent)'}</td>
                                <td className="py-1.5 px-2.5 text-center">
                                  {r.pass ? (
                                    <span className="text-emerald-400 font-bold">PASS</span>
                                  ) : (
                                    <span className="text-rose-400 font-bold">FAIL</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        {/* TEST 13: DAMP HEAT */}
        {activeTestNum === 13 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause B.2.2
                </div>
                <h3 className="text-base font-bold text-white">Test 13 — Damp Heat, Steady State</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Initial reference (20°C / 50% RH), High temp (40°C / 85% RH), Final reference (20°C / 50% RH). Corrected errors |Ec| ≤ MPE.
                </p>
              </div>
              {getBadge(report.test13?.overallResult)}
            </div>

            {report.test13?.stages.map((stg, i) => (
              <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                <div className="font-mono text-xs font-bold text-blue-400">
                  Stage {i + 1}: {stg.stageName} ({stg.temperature} °C, {stg.relativeHumidity}% RH)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 font-mono text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-1 px-3">Load (L)</th>
                        <th className="py-1 px-3">Indication (I)</th>
                        <th className="py-1 px-3">ΔL</th>
                        <th className="py-1 px-3">Corr. Error Ec</th>
                        <th className="py-1 px-3">MPE</th>
                        <th className="py-1 px-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {stg.loads.map((ld, li) => (
                        <tr key={li}>
                          <td className="py-1 px-3 font-semibold text-white">{ld.loadL} {inst.units}</td>
                          <td className="py-1 px-3 text-slate-300">{ld.indicationI}</td>
                          <td className="py-1 px-3 text-slate-400">{ld.deltaL}</td>
                          <td className="py-1 px-3 font-bold text-blue-300">{ld.correctedErrorEc?.toFixed(4) || '—'}</td>
                          <td className="py-1 px-3 text-amber-400">±{ld.mpe?.toFixed(4) || '—'}</td>
                          <td className="py-1 px-3 text-center">
                            {ld.pass ? (
                              <span className="text-emerald-400 font-bold">PASS</span>
                            ) : (
                              <span className="text-rose-400 font-bold">FAIL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TEST 14: SPAN STABILITY */}
        {activeTestNum === 14 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause B.4
                </div>
                <h3 className="text-base font-bold text-white">Test 14 — Span Stability</h3>
                <p className="text-xs text-slate-400 mt-1">
                  28-day period with measurements every 0.5–10 days. Allowable variation <span className="font-mono text-slate-200">A = max(0.5e, 0.5|MPE|)</span>. Acceptance: <span className="font-mono text-slate-200">V = max(X) − min(X) ≤ A</span>.
                </p>
              </div>
              {getBadge(report.test14?.overallResult)}
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono space-y-1">
              <div>Test Load: {report.test14?.testLoad} {inst.units}</div>
              <div>Initial R1 (Reading Trigger): {report.test14?.measurements[0]?.r1?.toFixed(4)} (Threshold: {report.test14?.initialR1Threshold?.toFixed(4)})</div>
              <div className="font-bold text-white">Total Span Variation V: {report.test14?.spanVariationV?.toFixed(4)} {inst.units}</div>
              <div className="text-amber-400 font-bold">Maximum Allowable Variation A: {report.test14?.allowableVariationA?.toFixed(4)} {inst.units}</div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Meas #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Temp (°C)</th>
                    <th className="py-2 px-3">Pressure</th>
                    <th className="py-2 px-3">Condition Description</th>
                    <th className="py-2 px-3">Average Error X</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test14?.measurements.map((m) => (
                    <tr key={m.measurementNumber} className="hover:bg-slate-800/40">
                      <td className="py-1.5 px-3 font-semibold text-white">#{m.measurementNumber}</td>
                      <td className="py-1.5 px-3 text-slate-300">{m.date}</td>
                      <td className="py-1.5 px-3 text-slate-300">{m.temperature} °C</td>
                      <td className="py-1.5 px-3 text-slate-400">{m.barometricPressure} hPa</td>
                      <td className="py-1.5 px-3 text-slate-400">{m.conditionDescription}</td>
                      <td className="py-1.5 px-3 font-bold text-blue-300">{m.averageX?.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 15: ENDURANCE */}
        {activeTestNum === 15 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Subclause A.6
                </div>
                <h3 className="text-base font-bold text-white">Test 15 — Endurance</h3>
                <p className="text-xs text-slate-400 mt-1">
                  100,000 cyclic loadings at ~0.5 Max. Durability error due to wear and tear: <span className="font-mono text-slate-200">Dwear = |Ec_initial − Ec_final| ≤ MPE(L)</span>.
                </p>
              </div>
              {getBadge(report.test15?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Load (L)</th>
                    <th className="py-2 px-3">Ec (Initial)</th>
                    <th className="py-2 px-3">Ec (Final 100k)</th>
                    <th className="py-2 px-3">Dwear (|Final - Initial|)</th>
                    <th className="py-2 px-3">MPE</th>
                    <th className="py-2 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {report.test15?.finalWeighing.map((fw, i) => {
                    const init = report.test15?.initialWeighing[i];
                    return (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-white">{fw.loadL} {inst.units}</td>
                        <td className="py-2 px-3 text-slate-300">{init?.correctedErrorEcInitial?.toFixed(4)}</td>
                        <td className="py-2 px-3 text-slate-300">{fw.correctedErrorEcFinal?.toFixed(4)}</td>
                        <td className="py-2 px-3 font-bold text-blue-300">{fw.durabilityErrorDwear?.toFixed(4)}</td>
                        <td className="py-2 px-3 text-amber-300">±{fw.mpe?.toFixed(4)}</td>
                        <td className="py-2 px-3 text-center">
                          {fw.pass ? (
                            <span className="text-emerald-400 font-bold">PASS</span>
                          ) : (
                            <span className="text-rose-400 font-bold">FAIL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 16: EXAMINATION OF CONSTRUCTION */}
        {activeTestNum === 16 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-1 Clause 4 &amp; 6
                </div>
                <h3 className="text-base font-bold text-white">Test 16 — Examination of Construction</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Descriptive and logical conformity examination: C(d) = 1 (Conforms), 0 (Non-conforms). Overall <span className="font-mono text-slate-200">C_all = ∏ C(d)</span>.
                </p>
              </div>
              {getBadge(report.test16?.overallResult)}
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="font-mono text-slate-400">General Description: </span>
                <span className="text-slate-200">{report.test16?.generalDescription}</span>
              </div>
              <div>
                <span className="font-mono text-slate-400">Main Components: </span>
                <span className="text-slate-200">{report.test16?.mainComponentsDescription}</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Feature Name</th>
                    <th className="py-2 px-3">Observed Construction</th>
                    <th className="py-2 px-3">Submitted Specification</th>
                    <th className="py-2 px-3 text-center">Conformity C(d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {report.test16?.features.map((ft) => (
                    <tr key={ft.featureId} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">{ft.featureName}</td>
                      <td className="py-2 px-3 text-slate-300 font-mono">{ft.observedSpecification}</td>
                      <td className="py-2 px-3 text-slate-400 font-mono">{ft.submittedSpecification}</td>
                      <td className="py-2 px-3 text-center font-mono">
                        {ft.conforms ? (
                          <span className="text-emerald-400 font-bold">1 (CONFORMS)</span>
                        ) : (
                          <span className="text-rose-400 font-bold">0 (NON-CONFORM)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEST 17: COMPLETE CHECKLIST */}
        {activeTestNum === 17 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-blue-400 uppercase">
                  OIML R 76-2 Clause 17
                </div>
                <h3 className="text-base font-bold text-white">Test 17 — Complete Checklist</h3>
                <p className="text-xs text-slate-400 mt-1">
                  17.1 All Types of Weighing Instruments, 17.2 Direct Sales &amp; Price Computing, 17.3 Electronic NAWIs.
                </p>
              </div>
              {getBadge(report.test17?.overallResult)}
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 font-mono text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Clause</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Requirement</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3">Inspector Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-sans">
                  {report.test17?.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono font-bold text-blue-400">{item.clause}</td>
                      <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{item.category}</td>
                      <td className="py-2 px-3 text-slate-200">{item.requirement}</td>
                      <td className="py-2 px-3 text-center">
                        {item.status === 'PASS' ? (
                          <span className="text-emerald-400 font-bold font-mono text-[11px]">PASS</span>
                        ) : item.status === 'FAIL' ? (
                          <span className="text-rose-400 font-bold font-mono text-[11px]">FAIL</span>
                        ) : (
                          <span className="text-amber-400 font-bold font-mono text-[11px]">{item.status}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px] italic">{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
