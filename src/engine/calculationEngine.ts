/**
 * Central Metrological Calculation Engine for OIML R 76-1 / R 76-2
 * Non-Automatic Weighing Instruments
 *
 * Implements high-precision Decimal arithmetic for all 17 OIML R76 tests.
 */

import Decimal from 'decimal.js';
import {
  AccuracyClass,
  Instrument,
  ResultState,
  EvaluationReport,
  Test1Data,
  Test2Data,
  Test3Data,
  Test4Data,
  Test5Data,
  Test6Data,
  Test7Data,
  Test8Data,
  Test9Data,
  Test10Data,
  Test11Data,
  Test12Data,
  Test13Data,
  Test14Data,
  Test15Data,
  Test16Data,
  Test17Data,
} from '../types/metrology';
import { calculateMPE, resolveApplicableRange } from './mpeEngine';
import { generateInitialTestsForInstrument } from './testTemplateGenerator';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toSafeDecimal(val: any, defaultVal: number | string = 0): Decimal {
  if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
    return new Decimal(defaultVal);
  }
  try {
    return new Decimal(val);
  } catch {
    return new Decimal(defaultVal);
  }
}

// ----------------------------------------------------
// COMMON WEIGHING ERROR: P = I + e/2 - ΔL, E = P - L, Ec = E - E0
// ----------------------------------------------------
export function calculateCommonWeighingError(
  indication: Decimal | number | any,
  deltaL: Decimal | number | any,
  load: Decimal | number | any,
  applicableE: Decimal | number | any,
  e0: Decimal | number | any = 0
): {
  p: Decimal;
  error: Decimal;
  correctedError: Decimal;
  m: Decimal;
} {
  const I = toSafeDecimal(indication);
  const dL = toSafeDecimal(deltaL);
  const L = toSafeDecimal(load);
  const e = toSafeDecimal(applicableE, 1);
  const err0 = toSafeDecimal(e0);

  // Conventional true indication before rounding: P = I + 0.5*e - ΔL
  const halfE = e.times(0.5);
  const p = I.plus(halfE).minus(dL);

  // Error: E = P - L
  const error = p.minus(L);

  // Corrected error: Ec = E - E0
  const correctedError = error.minus(err0);

  // Verification scale intervals: m = L / e
  const m = e.isZero() ? new Decimal(0) : L.abs().dividedBy(e);

  return { p, error, correctedError, m };
}

// ----------------------------------------------------
// TEST 1: Weighing Performance (A.4.4 / A.5.3.1)
// ----------------------------------------------------
export function evaluateTest1(
  data: Test1Data,
  instrument: Instrument
): { processedData: Test1Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 1: WEIGHING PERFORMANCE ===');

  if (!data.observations || data.observations.length === 0) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, 'Missing required observations. Result: INCOMPLETE.'],
    };
  }

  const e0 = new Decimal(data.e0 ?? 0);
  let allPass = true;
  let hasIncomplete = false;

  const processedObservations = data.observations.map((obs, idx) => {
    if (obs.load === undefined || obs.indication === undefined || obs.deltaL === undefined) {
      hasIncomplete = true;
      return { ...obs, pass: false };
    }

    const { applicableRange } = resolveApplicableRange(obs.load, instrument.ranges);
    const mpeRes = calculateMPE(obs.load, instrument.accuracyClass, instrument.ranges);

    const { p, error, correctedError, m } = calculateCommonWeighingError(
      obs.indication,
      obs.deltaL,
      obs.load,
      applicableRange.e,
      e0
    );

    const absEc = correctedError.abs();
    const isPass = absEc.lessThanOrEqualTo(mpeRes.mpeUnits);

    if (!isPass) {
      allPass = false;
    }

    log.push(
      `Load #${idx + 1} (${obs.direction}) L=${obs.load}: I=${obs.indication}, ΔL=${obs.deltaL} => P=${p.toFixed(4)}, E=${error.toFixed(4)}, Ec=${correctedError.toFixed(4)}, MPE=±${mpeRes.mpeUnits.toFixed(4)} => ${isPass ? 'PASS' : 'FAIL'}`
    );

    return {
      ...obs,
      p: p.toNumber(),
      error: error.toNumber(),
      correctedError: correctedError.toNumber(),
      m: m.toNumber(),
      mpe: mpeRes.mpeUnits.toNumber(),
      pass: isPass,
    };
  });

  // Supplementary zero-setting test check: if initial zero-setting > 20% Max, verify supplementary test
  if (data.initialZeroSettingOver20Percent && !data.supplementaryZeroTested) {
    log.push('Initial zero-setting > 20% Max requires supplementary zero-setting test (R 76-1, A.4.4.2). Marked INCOMPLETE.');
    hasIncomplete = true;
  }

  const overallResult: ResultState = hasIncomplete ? 'INCOMPLETE' : allPass ? 'PASS' : 'FAIL';
  log.push(`Overall Test 1 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      observations: processedObservations,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 2: Temperature Effect on No-load Indication (A.5.3.2)
// ----------------------------------------------------
export function evaluateTest2(
  data: Test2Data,
  instrument: Instrument
): { processedData: Test2Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 2: TEMPERATURE EFFECT ON NO-LOAD INDICATION ===');

  if (!data.points || data.points.length < 2) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, 'At least 2 consecutive temperature test points required. Result: INCOMPLETE.'],
    };
  }

  const baseE = new Decimal(instrument.ranges[0].e);
  let allPass = true;
  let hasIncomplete = false;

  const processedPoints = data.points.map((pt, idx) => {
    // P_i = I_i + e/2 - ΔL_i
    const I = new Decimal(pt.zeroIndication);
    const dL = new Decimal(pt.deltaL);
    const P = I.plus(baseE.times(0.5)).minus(dL);

    if (idx === 0) {
      return {
        ...pt,
        p: P.toNumber(),
        deltaP: 0,
        deltaT: 0,
        zeroChangePerRefTemp: 0,
        limit: baseE.toNumber(),
        pass: true,
      };
    }

    const prevP = new Decimal(data.points[idx - 1].zeroIndication)
      .plus(baseE.times(0.5))
      .minus(new Decimal(data.points[idx - 1].deltaL));
    const prevT = new Decimal(data.points[idx - 1].temperature);
    const currT = new Decimal(pt.temperature);

    const deltaP = P.minus(prevP);
    const deltaT = currT.minus(prevT);

    if (deltaT.isZero()) {
      hasIncomplete = true;
      log.push(`Point #${idx + 1}: ΔT is zero between consecutive points. Incomplete/invalid data.`);
      return {
        ...pt,
        p: P.toNumber(),
        deltaP: deltaP.toNumber(),
        deltaT: 0,
        pass: false,
      };
    }

    // Class I: |ΔP| / |ΔT| <= e
    // Classes II, III, IIII: (|ΔP| * 5) / |ΔT| <= e
    let zeroChangePerRefTemp: Decimal;
    if (instrument.accuracyClass === 'I') {
      zeroChangePerRefTemp = deltaP.abs().dividedBy(deltaT.abs());
    } else {
      zeroChangePerRefTemp = deltaP.abs().times(5).dividedBy(deltaT.abs());
    }

    const isPass = zeroChangePerRefTemp.lessThanOrEqualTo(baseE);
    if (!isPass) allPass = false;

    log.push(
      `Points #${idx} -> #${idx + 1}: T=${prevT.toString()}°C -> ${currT.toString()}°C (ΔT=${deltaT.abs().toString()}°C), ΔP=${deltaP.abs().toFixed(4)}. Zero-change metric=${zeroChangePerRefTemp.toFixed(4)}, limit (e)=${baseE.toString()} => ${isPass ? 'PASS' : 'FAIL'}`
    );

    return {
      ...pt,
      p: P.toNumber(),
      deltaP: deltaP.toNumber(),
      deltaT: deltaT.toNumber(),
      zeroChangePerRefTemp: zeroChangePerRefTemp.toNumber(),
      limit: baseE.toNumber(),
      pass: isPass,
    };
  });

  const overallResult: ResultState = hasIncomplete ? 'INCOMPLETE' : allPass ? 'PASS' : 'FAIL';
  log.push(`Overall Test 2 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      points: processedPoints,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 3: Eccentricity (A.4.7)
// ----------------------------------------------------
export function evaluateTest3(
  data: Test3Data,
  instrument: Instrument
): { processedData: Test3Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 3: ECCENTRICITY ===');

  const maxCap = new Decimal(instrument.ranges[instrument.ranges.length - 1].max);
  const tareMax = new Decimal(instrument.tareMax || 0);

  // Calculate required eccentricity load
  // Ordinary instrument <= 4 supports: Load = (Max + T_max) / 3
  // > 4 supports: Load = (Max + T_max) / (N - 1)
  let calcLoad: Decimal;
  if (data.numberOfSupports <= 4) {
    calcLoad = maxCap.plus(tareMax).dividedBy(3);
  } else {
    calcLoad = maxCap.plus(tareMax).dividedBy(data.numberOfSupports - 1);
  }

  log.push(`Prescribed load for ${data.numberOfSupports} supports: (Max ${maxCap.toString()} + Tare ${tareMax.toString()}) / ${data.numberOfSupports <= 4 ? 3 : data.numberOfSupports - 1} = ${calcLoad.toFixed(2)} ${instrument.units}`);

  if (data.method === 'WEIGHTS') {
    if (!data.weightPositions || data.weightPositions.length === 0) {
      return {
        processedData: { ...data, calculatedLoad: calcLoad.toNumber(), overallResult: 'INCOMPLETE' },
        calculationLog: [...log, 'Missing weight positions. Result: INCOMPLETE.'],
      };
    }

    let allPass = true;
    const processedPositions = data.weightPositions.map((pos) => {
      const { applicableRange } = resolveApplicableRange(pos.load, instrument.ranges);
      const mpeRes = calculateMPE(pos.load, instrument.accuracyClass, instrument.ranges);

      const { p, error, correctedError } = calculateCommonWeighingError(
        pos.indication,
        pos.deltaL,
        pos.load,
        applicableRange.e,
        pos.e0
      );

      const isPass = correctedError.abs().lessThanOrEqualTo(mpeRes.mpeUnits);
      if (!isPass) allPass = false;

      log.push(
        `Position ${pos.positionNumber} (${pos.positionName}): L=${pos.load}, I=${pos.indication}, ΔL=${pos.deltaL}, E0=${pos.e0} => Ec=${correctedError.toFixed(4)}, MPE=±${mpeRes.mpeUnits.toFixed(4)} => ${isPass ? 'PASS' : 'FAIL'}`
      );

      return {
        ...pos,
        p: p.toNumber(),
        error: error.toNumber(),
        correctedError: correctedError.toNumber(),
        mpe: mpeRes.mpeUnits.toNumber(),
        pass: isPass,
      };
    });

    const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
    log.push(`Overall Test 3 Result: ${overallResult}`);

    return {
      processedData: {
        ...data,
        calculatedLoad: calcLoad.toNumber(),
        weightPositions: processedPositions,
        overallResult,
      },
      calculationLog: log,
    };
  } else {
    // Rolling load
    if (!data.rollingPositions || data.rollingPositions.length === 0) {
      return {
        processedData: { ...data, calculatedLoad: calcLoad.toNumber(), overallResult: 'INCOMPLETE' },
        calculationLog: [...log, 'Missing rolling load positions. Result: INCOMPLETE.'],
      };
    }

    let allPass = true;
    const processedPositions = data.rollingPositions.map((pos) => {
      const { applicableRange } = resolveApplicableRange(pos.load, instrument.ranges);
      const mpeRes = calculateMPE(pos.load, instrument.accuracyClass, instrument.ranges);

      const { p, error, correctedError } = calculateCommonWeighingError(
        pos.indication,
        pos.deltaL,
        pos.load,
        applicableRange.e,
        pos.e0
      );

      const isPass = correctedError.abs().lessThanOrEqualTo(mpeRes.mpeUnits);
      if (!isPass) allPass = false;

      return {
        ...pos,
        correctedError: correctedError.toNumber(),
        mpe: mpeRes.mpeUnits.toNumber(),
        pass: isPass,
      };
    });

    const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
    return {
      processedData: {
        ...data,
        calculatedLoad: calcLoad.toNumber(),
        rollingPositions: processedPositions,
        overallResult,
      },
      calculationLog: log,
    };
  }
}

// ----------------------------------------------------
// TEST 4: Discrimination and Sensitivity (A.4.8 / A.4.9)
// ----------------------------------------------------
export function evaluateTest4(
  data: Test4Data,
  instrument: Instrument
): { processedData: Test4Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 4: DISCRIMINATION AND SENSITIVITY ===');

  let allPass = true;
  let hasIncomplete = false;

  if (data.mode === 'DIGITAL') {
    if (!data.digitalRows || data.digitalRows.length === 0) {
      return {
        processedData: { ...data, overallResult: 'INCOMPLETE' },
        calculationLog: [...log, 'Missing digital discrimination observations. Result: INCOMPLETE.'],
      };
    }

    const processedRows = data.digitalRows.map((r, idx) => {
      const diff = new Decimal(r.indication2).minus(new Decimal(r.indication1));
      const reqD = new Decimal(r.requiredD);
      // Digital discrimination: I2 - I1 >= d
      const pass = diff.greaterThanOrEqualTo(reqD);
      if (!pass) allPass = false;

      log.push(`Digital Load #${idx + 1} (${r.load}): I1=${r.indication1}, extraLoad(1.4d)=${r.extraLoad}, I2=${r.indication2} => I2-I1=${diff.toString()}, required d=${reqD.toString()} => ${pass ? 'PASS' : 'FAIL'}`);

      return {
        ...r,
        difference: diff.toNumber(),
        pass,
      };
    });

    const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
    return {
      processedData: { ...data, digitalRows: processedRows, overallResult },
      calculationLog: log,
    };
  } else if (data.mode === 'ANALOG') {
    if (!data.analogRows || data.analogRows.length === 0) {
      return {
        processedData: { ...data, overallResult: 'INCOMPLETE' },
        calculationLog: [...log, 'Missing analog discrimination observations. Result: INCOMPLETE.'],
      };
    }

    const processedRows = data.analogRows.map((r) => {
      const diff = new Decimal(r.indication2).minus(new Decimal(r.indication1)).abs();
      const requiredDiff = new Decimal(r.extraLoad).times(0.7);
      const pass = diff.greaterThanOrEqualTo(requiredDiff);
      if (!pass) allPass = false;

      return {
        ...r,
        difference: diff.toNumber(),
        requiredDiff: requiredDiff.toNumber(),
        pass,
      };
    });

    const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
    return {
      processedData: { ...data, analogRows: processedRows, overallResult },
      calculationLog: log,
    };
  } else {
    // NON-SELF-INDICATING
    let nonSelfPass = true;
    if (data.nonSelfRows && data.nonSelfRows.length > 0) {
      data.nonSelfRows.forEach((r) => {
        if (!r.visibleMovement) nonSelfPass = false;
      });
    }

    let sensPass = true;
    const processedSens = data.sensitivityRows?.map((r) => {
      const pass = r.displacementMm >= r.requiredDisplacementMm;
      if (!pass) sensPass = false;
      return { ...r, pass };
    });

    const overallResult: ResultState = (nonSelfPass && sensPass) ? 'PASS' : 'FAIL';
    return {
      processedData: { ...data, sensitivityRows: processedSens, overallResult },
      calculationLog: log,
    };
  }
}

// ----------------------------------------------------
// TEST 5: Repeatability (A.4.10)
// ----------------------------------------------------
export function evaluateTest5(
  data: Test5Data,
  instrument: Instrument
): { processedData: Test5Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 5: REPEATABILITY ===');

  const maxCap = instrument.ranges[instrument.ranges.length - 1].max;
  const requiredCount = maxCap < 1000 ? 10 : 3;

  function processSeries(series: typeof data.series50, label: string) {
    if (!series || !series.weighings || series.weighings.length < requiredCount) {
      log.push(`${label}: Missing required weighings (${series?.weighings?.length || 0} of ${requiredCount}). Marked incomplete.`);
      return { series, pass: false, incomplete: true };
    }

    const { applicableRange } = resolveApplicableRange(series.loadNominal, instrument.ranges);
    const mpeRes = calculateMPE(series.loadNominal, instrument.accuracyClass, instrument.ranges);

    let pVals: Decimal[] = [];
    let allIndivPass = true;

    const processedWeighings = series.weighings.map((w) => {
      const { p, error } = calculateCommonWeighingError(w.indication, w.deltaL, series.loadNominal, applicableRange.e, 0);
      pVals.push(p);
      const indivPass = error.abs().lessThanOrEqualTo(mpeRes.mpeUnits);
      if (!indivPass) allIndivPass = false;

      return {
        ...w,
        p: p.toNumber(),
        error: error.toNumber(),
        passIndividual: indivPass,
      };
    });

    let pMax = Decimal.max(...pVals);
    let pMin = Decimal.min(...pVals);
    let rangeR = pMax.minus(pMin);
    let rangePass = rangeR.lessThanOrEqualTo(mpeRes.mpeUnits);

    log.push(
      `${label} (Nominal=${series.loadNominal}): R = Pmax(${pMax.toFixed(4)}) - Pmin(${pMin.toFixed(4)}) = ${rangeR.toFixed(4)}, MPE=±${mpeRes.mpeUnits.toFixed(4)}. Individual: ${allIndivPass ? 'PASS' : 'FAIL'}, Range: ${rangePass ? 'PASS' : 'FAIL'}`
    );

    return {
      series: {
        ...series,
        weighings: processedWeighings,
        pMax: pMax.toNumber(),
        pMin: pMin.toNumber(),
        rangeR: rangeR.toNumber(),
        mpe: mpeRes.mpeUnits.toNumber(),
        rangePass: rangePass && allIndivPass,
      },
      pass: rangePass && allIndivPass,
      incomplete: false,
    };
  }

  const s50 = processSeries(data.series50, 'Around 50% Max');
  const s100 = processSeries(data.series100, 'Close to 100% Max');

  const hasIncomplete = s50.incomplete || s100.incomplete;
  const overallResult: ResultState = hasIncomplete ? 'INCOMPLETE' : (s50.pass && s100.pass) ? 'PASS' : 'FAIL';

  log.push(`Overall Test 5 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      requiredCount,
      series50: s50.series,
      series100: s100.series,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 6: Time-Dependence (A.4.11)
// ----------------------------------------------------
export function evaluateTest6(
  data: Test6Data,
  instrument: Instrument
): { processedData: Test6Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 6: TIME-DEPENDENCE ===');

  if (instrument.accuracyClass === 'I') {
    return {
      processedData: { ...data, overallResult: 'NOT_APPLICABLE' },
      calculationLog: [...log, 'Time-dependence test is NOT APPLICABLE to Class I instruments (OIML R 76-1, A.4.11).'],
    };
  }

  const e = new Decimal(instrument.ranges[0].e);
  // 6.1 Zero Return: D_ZR = |P30 - P0| <= 0.5 e
  const halfE = e.times(0.5);
  const p0 = new Decimal(data.indication0).plus(halfE).minus(new Decimal(data.deltaL0));
  const p30 = new Decimal(data.indication30).plus(halfE).minus(new Decimal(data.deltaL30));
  const deltaZR = p30.minus(p0).abs();
  const zeroReturnPass = deltaZR.lessThanOrEqualTo(halfE);

  log.push(`6.1 Zero Return: P0=${p0.toFixed(4)}, P30=${p30.toFixed(4)} => |P30 - P0| = ${deltaZR.toFixed(4)}, limit (0.5e) = ${halfE.toFixed(4)} => ${zeroReturnPass ? 'PASS' : 'FAIL'}`);

  // 6.2 Creep
  let creepPass = true;
  let creepTerminatedAt30Min = false;

  const processedCreep = data.creepReadings?.map((r) => {
    const p = new Decimal(r.indication).plus(halfE).minus(new Decimal(r.deltaL));
    return { ...r, p: p.toNumber() };
  }) || [];

  if (processedCreep.length >= 4) {
    const pStart = new Decimal(processedCreep[0].p!);
    const p15 = new Decimal(processedCreep[2].p!);
    const p30 = new Decimal(processedCreep[3].p!);

    const deltaP30 = p30.minus(pStart).abs();
    const diff15to30 = p30.minus(p15).abs();
    const point2E = e.times(0.2);

    if (deltaP30.lessThanOrEqualTo(halfE) && diff15to30.lessThanOrEqualTo(point2E)) {
      creepTerminatedAt30Min = true;
      creepPass = true;
      log.push(`6.2 Creep: |ΔP(30)|=${deltaP30.toFixed(4)} <= 0.5e AND |ΔP(30)-ΔP(15)|=${diff15to30.toFixed(4)} <= 0.2e. Terminated at 30 min: PASS.`);
    } else {
      // Must check extended readings up to 4h
      const mpeRes = calculateMPE(data.loadNominal, instrument.accuracyClass, instrument.ranges);
      for (const r of processedCreep) {
        const delta = new Decimal(r.p!).minus(pStart).abs();
        if (delta.greaterThan(mpeRes.mpeUnits)) {
          creepPass = false;
        }
      }
    }
  } else {
    creepPass = false;
  }

  const overallResult: ResultState = (zeroReturnPass && creepPass) ? 'PASS' : 'FAIL';
  return {
    processedData: {
      ...data,
      p0: p0.toNumber(),
      p30: p30.toNumber(),
      deltaZeroReturn: deltaZR.toNumber(),
      limitZeroReturn: halfE.toNumber(),
      zeroReturnPass,
      creepReadings: processedCreep,
      creepTerminatedAt30Min,
      creepPass,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 7: Stability of Equilibrium (A.4.12)
// ----------------------------------------------------
export function evaluateTest7(
  data: Test7Data,
  instrument: Instrument
): { processedData: Test7Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 7: STABILITY OF EQUILIBRIUM ===');

  const e = new Decimal(instrument.ranges[0].e);
  let allPass = true;

  const processedPrinting = data.printingTests?.map((pt) => {
    const dStab = new Decimal(pt.maxDuring5s).minus(new Decimal(pt.minDuring5s)).abs();
    const pass = dStab.lessThanOrEqualTo(e);
    if (!pass) allPass = false;
    return { ...pt, dStab: dStab.toNumber(), pass };
  }) || [];

  const processedZeroSetting = data.zeroSettingAccuracyTests?.map((zt) => {
    // E0 = I0 + e/2 - ΔL - L0
    const err = new Decimal(zt.indication).plus(e.times(0.5)).minus(new Decimal(zt.deltaL));
    const pass = err.abs().lessThanOrEqualTo(e.times(0.25));
    if (!pass) allPass = false;
    return { ...zt, errorE0: err.toNumber(), pass };
  }) || [];

  const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
  log.push(`Overall Test 7 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      printingTests: processedPrinting,
      zeroSettingAccuracyTests: processedZeroSetting,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 8: Tilting (A.5.1, A.5.2, A.5.3)
// ----------------------------------------------------
export function evaluateTest8(
  data: Test8Data,
  instrument: Instrument
): { processedData: Test8Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 8: TILTING ===');

  if (!instrument.hasLevelIndicator && instrument.accuracyClass === 'I') {
    return {
      processedData: { ...data, overallResult: 'NOT_APPLICABLE' },
      calculationLog: [...log, 'Tilting test not applicable for non-liable Class I instruments without level indicator.'],
    };
  }

  const baseE = new Decimal(instrument.ranges[0].e);
  let allPass = true;

  // Find reference measurement (upright)
  const ref = data.measurements?.find((m) => m.direction === 'REFERENCE');
  const refE0 = ref ? new Decimal(ref.i0).plus(baseE.times(0.5)).minus(new Decimal(ref.deltaL0)) : new Decimal(0);

  const processedMeasurements = data.measurements?.map((m) => {
    const e0 = new Decimal(m.i0).plus(baseE.times(0.5)).minus(new Decimal(m.deltaL0));
    const deltaE0 = e0.minus(refE0).abs();
    // No-load condition: |E0tilt - E0ref| <= 2e
    const noLoadPass = (instrument.accuracyClass === 'I' || (instrument.accuracyClass === 'II' && !instrument.isDirectSales))
      ? true
      : deltaE0.lessThanOrEqualTo(baseE.times(2));

    // Load 1
    const mpe1 = calculateMPE(m.load1, instrument.accuracyClass, instrument.ranges);
    const ec1 = new Decimal(m.i1).plus(baseE.times(0.5)).minus(new Decimal(m.deltaL1)).minus(new Decimal(m.load1)).minus(e0);
    const load1Pass = ec1.abs().lessThanOrEqualTo(mpe1.mpeUnits);

    // Load 2
    const mpe2 = calculateMPE(m.load2, instrument.accuracyClass, instrument.ranges);
    const ec2 = new Decimal(m.i2).plus(baseE.times(0.5)).minus(new Decimal(m.deltaL2)).minus(new Decimal(m.load2)).minus(e0);
    const load2Pass = ec2.abs().lessThanOrEqualTo(mpe2.mpeUnits);

    if (!noLoadPass || !load1Pass || !load2Pass) {
      allPass = false;
    }

    return {
      ...m,
      e0: e0.toNumber(),
      deltaE0VsRef: deltaE0.toNumber(),
      noLoadPass,
      ec1: ec1.toNumber(),
      mpe1: mpe1.mpeUnits.toNumber(),
      loadedPass1: load1Pass,
      ec2: ec2.toNumber(),
      mpe2: mpe2.mpeUnits.toNumber(),
      loadedPass2: load2Pass,
    };
  }) || [];

  const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
  return {
    processedData: {
      ...data,
      measurements: processedMeasurements,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 9: Tare (Weighing Test) (A.4.6.1)
// ----------------------------------------------------
export function evaluateTest9(
  data: Test9Data,
  instrument: Instrument
): { processedData: Test9Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 9: TARE (WEIGHING TEST) ===');

  if (!data.tareSteps || data.tareSteps.length === 0) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, 'Missing tare weighing test steps. Result: INCOMPLETE.'],
    };
  }

  let allPass = true;

  const processedTareSteps = data.tareSteps.map((step, sIdx) => {
    const e0 = new Decimal(step.e0);
    log.push(`Tare Step #${sIdx + 1} (Tare=${step.tareValue} ${instrument.units}, E0=${step.e0})`);

    const processedNetSteps = step.netLoadSteps.map((nStep) => {
      const { applicableRange } = resolveApplicableRange(nStep.netLoadL, instrument.ranges);
      // IMPORTANT: MPE is evaluated based on NET LOAD!
      const mpeNet = calculateMPE(nStep.netLoadL, instrument.accuracyClass, instrument.ranges);

      const { p, error, correctedError } = calculateCommonWeighingError(
        nStep.indicationI,
        nStep.deltaL,
        nStep.netLoadL,
        applicableRange.e,
        e0
      );

      const isPass = correctedError.abs().lessThanOrEqualTo(mpeNet.mpeUnits);
      if (!isPass) allPass = false;

      log.push(
        `  Net Load L=${nStep.netLoadL}: I=${nStep.indicationI}, ΔL=${nStep.deltaL} => Ec=${correctedError.toFixed(4)}, MPE(Net)=±${mpeNet.mpeUnits.toFixed(4)} => ${isPass ? 'PASS' : 'FAIL'}`
      );

      return {
        ...nStep,
        p: p.toNumber(),
        errorE: error.toNumber(),
        correctedErrorEc: correctedError.toNumber(),
        mpeNet: mpeNet.mpeUnits.toNumber(),
        pass: isPass,
      };
    });

    return {
      ...step,
      netLoadSteps: processedNetSteps,
    };
  });

  const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
  log.push(`Overall Test 9 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      tareSteps: processedTareSteps,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 10: Warm-Up Time (A.5.2)
// ----------------------------------------------------
export function evaluateTest10(
  data: Test10Data,
  instrument: Instrument
): { processedData: Test10Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 10: WARM-UP TIME ===');

  if (data.disconnectionDurationHours < 8) {
    log.push(`Disconnection duration (${data.disconnectionDurationHours} h) is less than required 8 hours.`);
  }

  if (!data.measurements || data.measurements.length === 0) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, 'Missing warm-up measurements. Result: INCOMPLETE.'],
    };
  }

  let allPass = data.noResultDuringWarmupPeriodVerified;
  const baseE = new Decimal(instrument.ranges[0].e);

  const processedMeasurements = data.measurements.map((m) => {
    // E0 = I0 + e/2 - ΔL0
    const err0 = toSafeDecimal(m.unloadedIndication).plus(baseE.times(0.5)).minus(toSafeDecimal(m.unloadedDeltaL));
    // EL = IL + e/2 - ΔL - L
    const errL = toSafeDecimal(m.loadedIndication)
      .plus(baseE.times(0.5))
      .minus(toSafeDecimal(m.loadedDeltaL))
      .minus(toSafeDecimal(m.loadNominal));

    const corrected = errL.minus(err0).abs();
    const mpeRes = calculateMPE(m.loadNominal, instrument.accuracyClass, instrument.ranges);
    const pass = corrected.lessThanOrEqualTo(mpeRes.mpeUnits);

    if (!pass) allPass = false;

    log.push(
      `Time ${m.timeMinutes} min: E0=${err0.toFixed(4)}, EL=${errL.toFixed(4)} => |EL - E0| = ${corrected.toFixed(4)}, MPE=±${mpeRes.mpeUnits.toFixed(4)} => ${pass ? 'PASS' : 'FAIL'}`
    );

    return {
      ...m,
      errorZeroE0: err0.toNumber(),
      errorLoadedEL: errL.toNumber(),
      correctedError: corrected.toNumber(),
      mpe: mpeRes.mpeUnits.toNumber(),
      pass,
    };
  });

  const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
  log.push(`Overall Test 10 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      measurements: processedMeasurements,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 11: Variations of Voltage (A.5.4)
// ----------------------------------------------------
export function evaluateTest11(
  data: Test11Data,
  instrument: Instrument
): { processedData: Test11Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 11: VARIATIONS OF VOLTAGE ===');

  if (!data.rows || data.rows.length === 0) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, 'Missing voltage test rows. Result: INCOMPLETE.'],
    };
  }

  let allPass = data.functionalOperationOk;
  const baseE = new Decimal(instrument.ranges[0].e);

  const processedRows = data.rows.map((row) => {
    const { applicableRange } = resolveApplicableRange(row.load, instrument.ranges);
    const mpeRes = calculateMPE(row.load, instrument.accuracyClass, instrument.ranges);

    const { error, correctedError } = calculateCommonWeighingError(
      row.indication,
      row.deltaL,
      row.load,
      applicableRange.e,
      0
    );

    const pass = correctedError.abs().lessThanOrEqualTo(mpeRes.mpeUnits);
    if (!pass) allPass = false;

    log.push(`Condition ${row.conditionLabel} (U=${row.voltage}V, L=${row.load}): Ec=${correctedError.toFixed(4)}, MPE=±${mpeRes.mpeUnits.toFixed(4)} => ${pass ? 'PASS' : 'FAIL'}`);

    return {
      ...row,
      errorE: error.toNumber(),
      correctedErrorEc: correctedError.toNumber(),
      mpe: mpeRes.mpeUnits.toNumber(),
      pass,
    };
  });

  const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
  log.push(`Overall Test 11 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      rows: processedRows,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 12: Electrical Disturbances / EMC (B.3)
// ----------------------------------------------------
export function evaluateTest12(
  data: Test12Data,
  instrument: Instrument
): { processedData: Test12Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 12: ELECTRICAL DISTURBANCES / EMC ===');

  if (!instrument.isElectronic) {
    return {
      processedData: { ...data, overallResult: 'NOT_APPLICABLE' },
      calculationLog: [...log, 'Electrical disturbance tests NOT APPLICABLE to mechanical instruments.'],
    };
  }

  const baseE = new Decimal(instrument.ranges[0].e);
  let allPass = true;

  function processGroup(rows: typeof data.electricalBursts, groupName: string) {
    if (!rows) return [];
    return rows.map((r) => {
      const diff = new Decimal(r.disturbedIndicationId).minus(new Decimal(r.referenceIndicationI0)).abs();
      // Primary criterion: |Id - I0| <= e OR significant fault detected and acted upon correctly
      const withinE = diff.lessThanOrEqualTo(baseE);
      const significantFaultHandled = r.significantFaultDetected && r.reactionCorrect;
      const pass = withinE || significantFaultHandled;
      if (!pass) allPass = false;

      log.push(`  ${groupName} [${r.subtestName}]: |Id - I0|=${diff.toString()}, e=${baseE.toString()}, SigFault=${r.significantFaultDetected}, Handled=${r.reactionCorrect} => ${pass ? 'PASS' : 'FAIL'}`);

      return {
        ...r,
        disturbanceError: diff.toNumber(),
        eLimit: baseE.toNumber(),
        pass,
      };
    });
  }

  const processedDips = processGroup(data.shortTimePowerReductions, 'Dips/Power Reductions');
  const processedBursts = processGroup(data.electricalBursts, 'Electrical Bursts');
  const processedEsd = processGroup(data.electrostaticDischarges, 'ESD');
  const processedRadiated = processGroup(data.radiatedFields, 'Radiated RF Fields');

  const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
  log.push(`Overall Test 12 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      shortTimePowerReductions: processedDips,
      electricalBursts: processedBursts,
      electrostaticDischarges: processedEsd,
      radiatedFields: processedRadiated,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 13: Damp Heat, Steady State (B.2.2)
// ----------------------------------------------------
export function evaluateTest13(
  data: Test13Data,
  instrument: Instrument
): { processedData: Test13Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 13: DAMP HEAT, STEADY STATE ===');

  const baseE = new Decimal(instrument.ranges[0].e);

  // Applicability check: Not applicable to Class I or Class II where e < 1g
  if (instrument.accuracyClass === 'I' || (instrument.accuracyClass === 'II' && baseE.lessThan(new Decimal(1)))) {
    return {
      processedData: { ...data, overallResult: 'NOT_APPLICABLE' },
      calculationLog: [...log, 'Damp heat steady state test is NOT APPLICABLE to Class I instruments or Class II instruments with e < 1g.'],
    };
  }

  if (!data.stages || data.stages.length < 3) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, 'Damp heat requires all 3 stages (Initial, High Temp 85% RH, Final). Result: INCOMPLETE.'],
    };
  }

  let allPass = true;

  const processedStages = data.stages.map((stage) => {
    const e0 = new Decimal(stage.e0);
    const processedLoads = stage.loads.map((ld) => {
      const { applicableRange } = resolveApplicableRange(ld.loadL, instrument.ranges);
      const mpeRes = calculateMPE(ld.loadL, instrument.accuracyClass, instrument.ranges);

      const { correctedError } = calculateCommonWeighingError(
        ld.indicationI,
        ld.deltaL,
        ld.loadL,
        applicableRange.e,
        e0
      );

      const pass = correctedError.abs().lessThanOrEqualTo(mpeRes.mpeUnits);
      if (!pass) allPass = false;

      return {
        ...ld,
        correctedErrorEc: correctedError.toNumber(),
        mpe: mpeRes.mpeUnits.toNumber(),
        pass,
      };
    });

    return {
      ...stage,
      loads: processedLoads,
    };
  });

  const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
  log.push(`Overall Test 13 Result: ${overallResult}`);

  return {
    processedData: {
      ...data,
      stages: processedStages,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 14: Span Stability (B.4)
// ----------------------------------------------------
export function evaluateTest14(
  data: Test14Data,
  instrument: Instrument
): { processedData: Test14Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 14: SPAN STABILITY ===');

  if (instrument.accuracyClass === 'I') {
    return {
      processedData: { ...data, overallResult: 'NOT_APPLICABLE' },
      calculationLog: [...log, 'Span stability test is NOT APPLICABLE to Class I instruments.'],
    };
  }

  if (!data.measurements || data.measurements.length < 8) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, `Span stability requires at least 8 measurement events (1 initial + 7 subsequent). Current count: ${data.measurements?.length || 0}. Marked INCOMPLETE.`],
    };
  }

  const baseE = new Decimal(instrument.ranges[0].e);
  const mpeInitial = calculateMPE(data.testLoad, instrument.accuracyClass, instrument.ranges);

  // Allowable variation: A = max(0.5e, 0.5 * |MPE_initial(Ltest)|)
  const allowableA = Decimal.max(baseE.times(0.5), mpeInitial.mpeUnits.times(0.5));
  const r1Trigger = baseE.times(0.1);

  let allX: Decimal[] = [];

  const processedMeasurements = data.measurements.map((m, idx) => {
    let readingXs: Decimal[] = [];
    const processedReadings = m.readings.map((r) => {
      const e0 = toSafeDecimal(r.i0).plus(baseE.times(0.5)).minus(toSafeDecimal(r.deltaL0));
      const eL = toSafeDecimal(r.iL).plus(baseE.times(0.5)).minus(toSafeDecimal(r.deltaL)).minus(toSafeDecimal(data.testLoad));
      const x = eL.minus(e0);
      readingXs.push(x);
      return {
        ...r,
        e0: e0.toNumber(),
        eL: eL.toNumber(),
        x: x.toNumber(),
      };
    });

    const sumX = readingXs.reduce((acc, curr) => acc.plus(curr), new Decimal(0));
    const avgX = sumX.dividedBy(readingXs.length);
    allX.push(avgX);

    let r1: Decimal | undefined;
    if (idx === 0) {
      const maxX = Decimal.max(...readingXs);
      const minX = Decimal.min(...readingXs);
      r1 = maxX.minus(minX);
      log.push(`Initial Measurement #1: R1 = ${r1.toFixed(4)}, trigger (0.1e) = ${r1Trigger.toFixed(4)}. Subsequent single-readings permitted: ${r1.lessThanOrEqualTo(r1Trigger)}`);
    }

    return {
      ...m,
      readings: processedReadings,
      averageX: avgX.toNumber(),
      r1: r1 ? r1.toNumber() : undefined,
    };
  });

  const maxSpan = Decimal.max(...allX);
  const minSpan = Decimal.min(...allX);
  const spanVariationV = maxSpan.minus(minSpan);
  const pass = spanVariationV.lessThanOrEqualTo(allowableA);

  log.push(`Span variation V = max(X) - min(X) = ${spanVariationV.toFixed(4)}, Allowable A = ${allowableA.toFixed(4)} => ${pass ? 'PASS' : 'FAIL'}`);

  const overallResult: ResultState = pass ? 'PASS' : 'FAIL';

  return {
    processedData: {
      ...data,
      allowableVariationA: allowableA.toNumber(),
      initialR1Threshold: r1Trigger.toNumber(),
      measurements: processedMeasurements,
      spanVariationV: spanVariationV.toNumber(),
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 15: Endurance (A.6)
// ----------------------------------------------------
export function evaluateTest15(
  data: Test15Data,
  instrument: Instrument
): { processedData: Test15Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 15: ENDURANCE ===');

  const maxCap = instrument.ranges[instrument.ranges.length - 1].max;
  const isClassOk = ['II', 'III', 'IIII'].includes(instrument.accuracyClass);
  const isMaxOk = maxCap <= 100;

  if (!isClassOk || !isMaxOk) {
    return {
      processedData: { ...data, overallResult: 'NOT_APPLICABLE' },
      calculationLog: [...log, `Endurance test is NOT APPLICABLE: required Class II/III/IIII with Max <= 100 kg. (Current: Class ${instrument.accuracyClass}, Max ${maxCap} kg).`],
    };
  }

  if (data.numberOfLoadings < 100000) {
    log.push(`Required 100,000 loadings; recorded ${data.numberOfLoadings}.`);
  }

  let allPass = true;
  const processedFinal = data.finalWeighing?.map((fw, idx) => {
    const init = data.initialWeighing?.[idx];
    const ecInit = new Decimal(init?.correctedErrorEcInitial || 0);
    const ecFinal = new Decimal(fw.correctedErrorEcFinal || 0);
    const dWear = ecFinal.minus(ecInit).abs();
    const mpeRes = calculateMPE(fw.loadL, instrument.accuracyClass, instrument.ranges);
    const pass = dWear.lessThanOrEqualTo(mpeRes.mpeUnits);

    if (!pass) allPass = false;

    log.push(`Endurance Load L=${fw.loadL}: Ec_init=${ecInit.toFixed(4)}, Ec_final=${ecFinal.toFixed(4)} => Dwear = ${dWear.toFixed(4)}, MPE=±${mpeRes.mpeUnits.toFixed(4)} => ${pass ? 'PASS' : 'FAIL'}`);

    return {
      ...fw,
      durabilityErrorDwear: dWear.toNumber(),
      mpe: mpeRes.mpeUnits.toNumber(),
      pass,
    };
  }) || [];

  const overallResult: ResultState = allPass ? 'PASS' : 'FAIL';
  return {
    processedData: {
      ...data,
      finalWeighing: processedFinal,
      overallResult,
    },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 16: Examination of the Construction (Clause 4 & 6)
// ----------------------------------------------------
export function evaluateTest16(
  data: Test16Data
): { processedData: Test16Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 16: EXAMINATION OF THE CONSTRUCTION ===');

  if (!data.features || data.features.length === 0) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, 'Missing construction features examination. Result: INCOMPLETE.'],
    };
  }

  // Logical conformity testing: C_all = product(C(d)). PASS iff every feature conforms
  let allConforms = true;
  data.features.forEach((feat) => {
    if (!feat.conforms) {
      allConforms = false;
      log.push(`Non-conformance: [${feat.featureName}] ${feat.remarks || ''}`);
    }
  });

  const overallResult: ResultState = allConforms ? 'PASS' : 'FAIL';
  log.push(`Overall Test 16 Result: ${overallResult}`);

  return {
    processedData: { ...data, overallResult },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// TEST 17: Complete Checklist (Clause 3, 4, 5, 7)
// ----------------------------------------------------
export function evaluateTest17(
  data: Test17Data
): { processedData: Test17Data; calculationLog: string[] } {
  const log: string[] = [];
  log.push('=== EVALUATING TEST 17: COMPLETE CHECKLIST ===');

  if (!data.items || data.items.length === 0) {
    return {
      processedData: { ...data, overallResult: 'INCOMPLETE' },
      calculationLog: [...log, 'No checklist items found. Result: INCOMPLETE.'],
    };
  }

  let hasFail = false;
  let hasIncomplete = false;

  data.items.forEach((item) => {
    if (!item.applicable) {
      return;
    }
    if (item.status === 'FAIL') {
      hasFail = true;
      log.push(`Checklist FAIL: [Clause ${item.clause}] ${item.requirement}`);
    } else if (item.status === 'INCOMPLETE') {
      hasIncomplete = true;
      log.push(`Checklist INCOMPLETE: [Clause ${item.clause}] ${item.requirement}`);
    }
  });

  let overallResult: ResultState = 'PASS';
  if (hasFail) {
    overallResult = 'FAIL';
  } else if (hasIncomplete) {
    overallResult = 'INCOMPLETE';
  }

  log.push(`Overall Test 17 Result: ${overallResult}`);

  return {
    processedData: { ...data, overallResult },
    calculationLog: log,
  };
}

// ----------------------------------------------------
// MASTER EVALUATOR: Evaluates all 17 tests on a report
// ----------------------------------------------------
export function evaluateAllReportTests(inputReport: EvaluationReport): {
  report: EvaluationReport;
  logs: string[];
} {
  let report = { ...inputReport };
  const inst = report.instrument;
  const executionLogs: string[] = [];

  // If report tests are uninitialized or missing observations, generate test templates
  if (!report.test1 || !report.test1.observations || report.test1.observations.length === 0) {
    const generated = generateInitialTestsForInstrument(inst);
    report = {
      ...report,
      ...generated,
    };
  }

  // 1. Weighing Performance
  let test1 = report.test1;
  if (test1) {
    try {
      const res1 = evaluateTest1(test1, inst);
      test1 = res1.processedData;
      executionLogs.push(...res1.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 1 evaluation notice: ${err.message}`);
    }
  }

  // 2. Temperature Effect
  let test2 = report.test2;
  if (test2) {
    try {
      const res2 = evaluateTest2(test2, inst);
      test2 = res2.processedData;
      executionLogs.push(...res2.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 2 evaluation notice: ${err.message}`);
    }
  }

  // 3. Eccentricity
  let test3 = report.test3;
  if (test3) {
    try {
      const res3 = evaluateTest3(test3, inst);
      test3 = res3.processedData;
      executionLogs.push(...res3.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 3 evaluation notice: ${err.message}`);
    }
  }

  // 4. Discrimination
  let test4 = report.test4;
  if (test4) {
    try {
      const res4 = evaluateTest4(test4, inst);
      test4 = res4.processedData;
      executionLogs.push(...res4.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 4 evaluation notice: ${err.message}`);
    }
  }

  // 5. Repeatability
  let test5 = report.test5;
  if (test5) {
    try {
      const res5 = evaluateTest5(test5, inst);
      test5 = res5.processedData;
      executionLogs.push(...res5.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 5 evaluation notice: ${err.message}`);
    }
  }

  // 6. Time Dependence
  let test6 = report.test6;
  if (test6) {
    try {
      const res6 = evaluateTest6(test6, inst);
      test6 = res6.processedData;
      executionLogs.push(...res6.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 6 evaluation notice: ${err.message}`);
    }
  }

  // 7. Stability of Equilibrium
  let test7 = report.test7;
  if (test7) {
    try {
      const res7 = evaluateTest7(test7, inst);
      test7 = res7.processedData;
      executionLogs.push(...res7.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 7 evaluation notice: ${err.message}`);
    }
  }

  // 8. Tilting
  let test8 = report.test8;
  if (test8) {
    try {
      const res8 = evaluateTest8(test8, inst);
      test8 = res8.processedData;
      executionLogs.push(...res8.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 8 evaluation notice: ${err.message}`);
    }
  }

  // 9. Tare Test
  let test9 = report.test9;
  if (test9) {
    try {
      const res9 = evaluateTest9(test9, inst);
      test9 = res9.processedData;
      executionLogs.push(...res9.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 9 evaluation notice: ${err.message}`);
    }
  }

  // 10. Warm-Up Time
  let test10 = report.test10;
  if (test10) {
    try {
      const res10 = evaluateTest10(test10, inst);
      test10 = res10.processedData;
      executionLogs.push(...res10.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 10 evaluation notice: ${err.message}`);
    }
  }

  // 11. Voltage Variations
  let test11 = report.test11;
  if (test11) {
    try {
      const res11 = evaluateTest11(test11, inst);
      test11 = res11.processedData;
      executionLogs.push(...res11.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 11 evaluation notice: ${err.message}`);
    }
  }

  // 12. Electrical Disturbances / EMC
  let test12 = report.test12;
  if (test12) {
    try {
      const res12 = evaluateTest12(test12, inst);
      test12 = res12.processedData;
      executionLogs.push(...res12.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 12 evaluation notice: ${err.message}`);
    }
  }

  // 13. Damp Heat Steady State
  let test13 = report.test13;
  if (test13) {
    try {
      const res13 = evaluateTest13(test13, inst);
      test13 = res13.processedData;
      executionLogs.push(...res13.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 13 evaluation notice: ${err.message}`);
    }
  }

  // 14. Span Stability
  let test14 = report.test14;
  if (test14) {
    try {
      const res14 = evaluateTest14(test14, inst);
      test14 = res14.processedData;
      executionLogs.push(...res14.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 14 evaluation notice: ${err.message}`);
    }
  }

  // 15. Endurance
  let test15 = report.test15;
  if (test15) {
    try {
      const res15 = evaluateTest15(test15, inst);
      test15 = res15.processedData;
      executionLogs.push(...res15.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 15 evaluation notice: ${err.message}`);
    }
  }

  // 16. Examination of Construction
  let test16 = report.test16;
  if (test16) {
    try {
      const res16 = evaluateTest16(test16);
      test16 = res16.processedData;
      executionLogs.push(...res16.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 16 evaluation notice: ${err.message}`);
    }
  }

  // 17. Checklist
  let test17 = report.test17;
  if (test17) {
    try {
      const res17 = evaluateTest17(test17);
      test17 = res17.processedData;
      executionLogs.push(...res17.calculationLog);
    } catch (err: any) {
      executionLogs.push(`Test 17 evaluation notice: ${err.message}`);
    }
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

  let overallResult = report.overallResult || 'PASS';
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

  return { report: updatedReport, logs: executionLogs };
}
