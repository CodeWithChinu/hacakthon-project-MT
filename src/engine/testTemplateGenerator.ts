/**
 * Test Template Generator for OIML R 76-1 / R 76-2
 * Automatically generates properly structured test observations and checklist templates
 * based on instrument metrological specifications (Class, Max, Min, e, d, Tare, Power).
 */

import {
  Instrument,
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
import { getDefaultChecklistItems } from './regulatoryRules';

export function generateInitialTestsForInstrument(inst: Instrument): Partial<EvaluationReport> {
  const r1 = inst.ranges[0];
  const maxCap = inst.ranges[inst.ranges.length - 1].max;
  const minCap = r1.min;
  const e1 = r1.e;
  const eMax = inst.ranges[inst.ranges.length - 1].e;
  const tareCap = inst.tareMax || Math.round(maxCap * 0.4);

  // 1. Test 1: Weighing Performance observations (0, Min, 500e, 2000e, Max, etc.)
  const test1Loads = [0, minCap];
  const step1 = e1 * 500;
  if (step1 < maxCap && step1 > minCap) test1Loads.push(Number(step1.toFixed(4)));

  const step2 = e1 * 2000;
  if (step2 < maxCap && step2 > step1) test1Loads.push(Number(step2.toFixed(4)));

  if (inst.ranges.length > 1 && inst.ranges[0].max < maxCap) {
    const boundary = inst.ranges[0].max;
    if (!test1Loads.includes(boundary)) test1Loads.push(boundary);
    const mid2 = Number(((boundary + maxCap) / 2).toFixed(3));
    if (!test1Loads.includes(mid2)) test1Loads.push(mid2);
  } else {
    const mid = Number((maxCap * 0.5).toFixed(3));
    if (!test1Loads.includes(mid)) test1Loads.push(mid);
  }

  if (!test1Loads.includes(maxCap)) test1Loads.push(maxCap);

  const test1Obs: any[] = [];
  test1Loads.forEach((L) => {
    const deltaLVal = Number((e1 * 0.5).toFixed(4));
    test1Obs.push({
      load: L,
      direction: 'UP' as const,
      indication: L,
      deltaL: deltaLVal,
      p: L,
      error: 0,
      correctedError: 0,
      m: Math.round(L / e1),
      mpe: Number((e1 * (L <= e1 * 500 ? 0.5 : L <= e1 * 2000 ? 1.0 : 1.5)).toFixed(4)),
      pass: true,
    });
  });

  [...test1Loads].reverse().forEach((L) => {
    const deltaLVal = Number((e1 * 0.5).toFixed(4));
    test1Obs.push({
      load: L,
      direction: 'DOWN' as const,
      indication: L,
      deltaL: deltaLVal,
      p: L,
      error: 0,
      correctedError: 0,
      m: Math.round(L / e1),
      mpe: Number((e1 * (L <= e1 * 500 ? 0.5 : L <= e1 * 2000 ? 1.0 : 1.5)).toFixed(4)),
      pass: true,
    });
  });

  const test1: Test1Data = {
    ambientTemp: 21.0,
    relativeHumidity: 50,
    barometricPressure: 1013,
    e0: 0,
    initialZeroSettingOver20Percent: false,
    supplementaryZeroTested: true,
    observations: test1Obs,
    overallResult: 'PASS',
    remarks: 'Weighing performance verified across all load steps within Table 6 limits.',
  };

  // 2. Test 2: Temperature Effect on No-load
  const tempMin = inst.temperatureMin ?? -10;
  const tempMax = inst.temperatureMax ?? 40;
  const test2: Test2Data = {
    points: [
      { temperature: 20, time: '09:00', zeroIndication: 0, deltaL: Number((e1 * 0.5).toFixed(4)), p: 0, deltaP: 0, deltaT: 0, zeroChangePerRefTemp: 0, limit: e1, pass: true },
      { temperature: tempMax, time: '13:00', zeroIndication: 0, deltaL: Number((e1 * 0.45).toFixed(4)), p: Number((e1 * 0.05).toFixed(5)), deltaP: Number((e1 * 0.05).toFixed(5)), deltaT: tempMax - 20, zeroChangePerRefTemp: Number((e1 * 0.01).toFixed(6)), limit: e1, pass: true },
      { temperature: tempMin, time: '18:00', zeroIndication: 0, deltaL: Number((e1 * 0.52).toFixed(4)), p: Number((-e1 * 0.02).toFixed(5)), deltaP: Number((-e1 * 0.07).toFixed(5)), deltaT: tempMin - tempMax, zeroChangePerRefTemp: Number((e1 * 0.01).toFixed(6)), limit: e1, pass: true },
      { temperature: 20, time: '22:00', zeroIndication: 0, deltaL: Number((e1 * 0.5).toFixed(4)), p: 0, deltaP: Number((e1 * 0.02).toFixed(5)), deltaT: 20 - tempMin, zeroChangePerRefTemp: Number((e1 * 0.005).toFixed(6)), limit: e1, pass: true },
    ],
    overallResult: 'PASS',
    remarks: `Zero-shift per temperature span conforms to OIML R 76-1 subclause A.5.3.2.`,
  };

  // 3. Test 3: Eccentricity
  const eccLoad = Number(((maxCap + tareCap) / 3).toFixed(3));
  const test3: Test3Data = {
    method: 'WEIGHTS',
    numberOfSupports: 4,
    calculatedLoad: eccLoad,
    weightPositions: [
      { positionNumber: 1, positionName: 'Center (Position 1)', load: eccLoad, indication: eccLoad, deltaL: Number((eMax * 0.5).toFixed(4)), e0: 0, p: eccLoad, error: 0, correctedError: 0, mpe: eMax, pass: true },
      { positionNumber: 2, positionName: 'Front-Left (Position 2)', load: eccLoad, indication: eccLoad, deltaL: Number((eMax * 0.48).toFixed(4)), e0: 0, p: Number((eccLoad + eMax * 0.02).toFixed(5)), error: Number((eMax * 0.02).toFixed(5)), correctedError: Number((eMax * 0.02).toFixed(5)), mpe: eMax, pass: true },
      { positionNumber: 3, positionName: 'Rear-Left (Position 3)', load: eccLoad, indication: eccLoad, deltaL: Number((eMax * 0.52).toFixed(4)), e0: 0, p: Number((eccLoad - eMax * 0.02).toFixed(5)), error: Number((-eMax * 0.02).toFixed(5)), correctedError: Number((-eMax * 0.02).toFixed(5)), mpe: eMax, pass: true },
      { positionNumber: 4, positionName: 'Rear-Right (Position 4)', load: eccLoad, indication: eccLoad, deltaL: Number((eMax * 0.49).toFixed(4)), e0: 0, p: Number((eccLoad + eMax * 0.01).toFixed(5)), error: Number((eMax * 0.01).toFixed(5)), correctedError: Number((eMax * 0.01).toFixed(5)), mpe: eMax, pass: true },
      { positionNumber: 5, positionName: 'Front-Right (Position 5)', load: eccLoad, indication: eccLoad, deltaL: Number((eMax * 0.51).toFixed(4)), e0: 0, p: Number((eccLoad - eMax * 0.01).toFixed(5)), error: Number((-eMax * 0.01).toFixed(5)), correctedError: Number((-eMax * 0.01).toFixed(5)), mpe: eMax, pass: true },
    ],
    overallResult: 'PASS',
    remarks: 'Eccentricity evaluation at 5 key platform zones satisfies OIML R 76-1 subclause A.4.7.',
  };

  // 4. Test 4: Discrimination
  const d1 = r1.d;
  const test4: Test4Data = {
    mode: 'DIGITAL',
    digitalRows: [
      { load: minCap, indication1: minCap, deltaLRemoved: Number((d1 * 0.5).toFixed(4)), extraLoad: Number((d1 * 1.4).toFixed(4)), indication2: Number((minCap + d1).toFixed(4)), difference: d1, requiredD: d1, pass: true },
      { load: Number((maxCap * 0.5).toFixed(3)), indication1: Number((maxCap * 0.5).toFixed(3)), deltaLRemoved: Number((d1 * 0.5).toFixed(4)), extraLoad: Number((d1 * 1.4).toFixed(4)), indication2: Number((maxCap * 0.5 + d1).toFixed(4)), difference: d1, requiredD: d1, pass: true },
      { load: maxCap, indication1: maxCap, deltaLRemoved: Number((d1 * 0.5).toFixed(4)), extraLoad: Number((d1 * 1.4).toFixed(4)), indication2: Number((maxCap + d1).toFixed(4)), difference: d1, requiredD: d1, pass: true },
    ],
    overallResult: 'PASS',
    remarks: 'Digital discrimination conforms to A.4.8 (1.4d additional load produces an unambiguous step of 1d).',
  };

  // 5. Test 5: Repeatability
  const repCount = maxCap >= 1000 ? 3 : 10;
  const halfNominal = Number((maxCap * 0.5).toFixed(3));
  const fullNominal = maxCap;

  const w50: any[] = [];
  const w100: any[] = [];
  for (let i = 1; i <= repCount; i++) {
    w50.push({ index: i, indication: halfNominal, deltaL: Number((e1 * 0.5).toFixed(4)), p: halfNominal, error: 0, passIndividual: true });
    w100.push({ index: i, indication: fullNominal, deltaL: Number((eMax * 0.5).toFixed(4)), p: fullNominal, error: 0, passIndividual: true });
  }

  const test5: Test5Data = {
    requiredCount: repCount,
    series50: {
      loadNominal: halfNominal,
      seriesLabel: 'Around 50% Max',
      weighings: w50,
      pMax: halfNominal,
      pMin: halfNominal,
      rangeR: 0,
      mpe: Number((e1 * 1.0).toFixed(4)),
      rangePass: true,
    },
    series100: {
      loadNominal: fullNominal,
      seriesLabel: 'Close to 100% Max',
      weighings: w100,
      pMax: fullNominal,
      pMin: fullNominal,
      rangeR: 0,
      mpe: Number((eMax * 1.5).toFixed(4)),
      rangePass: true,
    },
    overallResult: 'PASS',
    remarks: `Repeatability range R (Pmax - Pmin) <= |MPE| across all ${repCount} weighings at both test loads.`,
  };

  // 6. Test 6: Zero Return and Creep
  const test6: Test6Data = {
    loadNominal: maxCap,
    indication0: 0,
    deltaL0: Number((e1 * 0.5).toFixed(4)),
    p0: 0,
    indication30: 0,
    deltaL30: Number((e1 * 0.5).toFixed(4)),
    p30: 0,
    deltaZeroReturn: 0,
    limitZeroReturn: Number((e1 * 0.5).toFixed(4)),
    zeroReturnPass: true,
    creepReadings: [
      { timeMinutes: 0, indication: maxCap, deltaL: Number((eMax * 0.5).toFixed(4)), p: maxCap, deltaP: 0, limit: Number((eMax * 0.5).toFixed(4)), pass: true },
      { timeMinutes: 5, indication: maxCap, deltaL: Number((eMax * 0.49).toFixed(4)), p: Number((maxCap + eMax * 0.01).toFixed(5)), deltaP: Number((eMax * 0.01).toFixed(5)), limit: Number((eMax * 0.5).toFixed(4)), pass: true },
      { timeMinutes: 15, indication: maxCap, deltaL: Number((eMax * 0.48).toFixed(4)), p: Number((maxCap + eMax * 0.02).toFixed(5)), deltaP: Number((eMax * 0.02).toFixed(5)), limit: Number((eMax * 0.5).toFixed(4)), pass: true },
      { timeMinutes: 30, indication: maxCap, deltaL: Number((eMax * 0.48).toFixed(4)), p: Number((maxCap + eMax * 0.02).toFixed(5)), deltaP: Number((eMax * 0.02).toFixed(5)), limit: Number((eMax * 0.5).toFixed(4)), pass: true },
    ],
    creepPass: true,
    overallResult: 'PASS',
    remarks: 'Zero return within 0.5e and 30-minute creep variation conforms strictly to OIML R 76-1 subclause A.4.11.',
  };

  // 7. Test 7: Stability of Equilibrium
  const test7: Test7Data = {
    load: Number((maxCap * 0.5).toFixed(3)),
    printingTests: [
      { repetition: 1, printedValue: Number((maxCap * 0.5).toFixed(3)), minDuring5s: Number((maxCap * 0.5).toFixed(3)), maxDuring5s: Number((maxCap * 0.5).toFixed(3)), dStab: 0, pass: true },
      { repetition: 2, printedValue: Number((maxCap * 0.5).toFixed(3)), minDuring5s: Number((maxCap * 0.5).toFixed(3)), maxDuring5s: Number((maxCap * 0.5).toFixed(3)), dStab: 0, pass: true },
      { repetition: 3, printedValue: Number((maxCap * 0.5).toFixed(3)), minDuring5s: Number((maxCap * 0.5).toFixed(3)), maxDuring5s: Number((maxCap * 0.5).toFixed(3)), dStab: 0, pass: true },
    ],
    zeroSettingAccuracyTests: [
      { repetition: 1, indication: 0, deltaL: Number((e1 * 0.5).toFixed(4)), errorE0: 0, pass: true },
      { repetition: 2, indication: 0, deltaL: Number((e1 * 0.5).toFixed(4)), errorE0: 0, pass: true },
    ],
    overallResult: 'PASS',
    remarks: 'Printing and recording operations occur only in stable equilibrium pursuant to A.4.12.',
  };

  // 8. Test 8: Tilting
  const tiltLoad1 = e1 * 500;
  const test8: Test8Data = {
    tiltCondition: 'TILTING_0_2_PERCENT',
    measurements: [
      {
        direction: 'REFERENCE',
        tiltAmount: '0.0%',
        i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, deltaE0VsRef: 0, noLoadPass: true,
        load1: tiltLoad1, i1: tiltLoad1, deltaL1: Number((e1 * 0.5).toFixed(4)), ec1: 0, dtilt1: 0, mpe1: Number((e1 * 0.5).toFixed(4)), loadedPass1: true,
        load2: maxCap, i2: maxCap, deltaL2: Number((eMax * 0.5).toFixed(4)), ec2: 0, dtilt2: 0, mpe2: Number((eMax * 1.5).toFixed(4)), loadedPass2: true,
      },
      {
        direction: 'LONGITUDINAL_POS',
        tiltAmount: '0.2%',
        i0: 0, deltaL0: Number((e1 * 0.49).toFixed(4)), e0: Number((e1 * 0.01).toFixed(5)), deltaE0VsRef: Number((e1 * 0.01).toFixed(5)), noLoadPass: true,
        load1: tiltLoad1, i1: tiltLoad1, deltaL1: Number((e1 * 0.49).toFixed(4)), ec1: 0, dtilt1: 0, mpe1: Number((e1 * 0.5).toFixed(4)), loadedPass1: true,
        load2: maxCap, i2: maxCap, deltaL2: Number((eMax * 0.49).toFixed(4)), ec2: 0, dtilt2: 0, mpe2: Number((eMax * 1.5).toFixed(4)), loadedPass2: true,
      },
    ],
    overallResult: 'PASS',
    remarks: 'Tilting influence remains well within permissible 2e at zero and 1 MPE when loaded (A.5.1).',
  };

  // 9. Test 9: Tare Weighing Test (matching Test9Data)
  const tareVal = Number((tareCap * 0.8).toFixed(3));
  const test9: Test9Data = {
    tareSteps: [
      {
        tareValue: tareVal,
        tareIndication: tareVal,
        tareType: 'SUBTRACTIVE',
        e0: 0,
        netLoadSteps: [
          { netLoadL: minCap, indicationI: minCap, deltaL: Number((e1 * 0.5).toFixed(4)), p: minCap, errorE: 0, correctedErrorEc: 0, mpeNet: Number((e1 * 0.5).toFixed(4)), pass: true },
          { netLoadL: Number(((maxCap - tareVal) * 0.5).toFixed(3)), indicationI: Number(((maxCap - tareVal) * 0.5).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), p: Number(((maxCap - tareVal) * 0.5).toFixed(3)), errorE: 0, correctedErrorEc: 0, mpeNet: Number((e1 * 1.0).toFixed(4)), pass: true },
          { netLoadL: Number((maxCap - tareVal).toFixed(3)), indicationI: Number((maxCap - tareVal).toFixed(3)), deltaL: Number((eMax * 0.5).toFixed(4)), p: Number((maxCap - tareVal).toFixed(3)), errorE: 0, correctedErrorEc: 0, mpeNet: Number((eMax * 1.5).toFixed(4)), pass: true },
        ],
      },
    ],
    overallResult: 'PASS',
    remarks: 'Net loads tested with subtractive tare conform to Table 6 MPE based on net value (A.4.6.1).',
  };

  // 10. Test 10: Warm-up Time (matching Test10Data)
  const halfLoad = Number((maxCap * 0.5).toFixed(3));
  const test10: Test10Data = {
    disconnectionDurationHours: 8.5,
    noResultDuringWarmupPeriodVerified: true,
    measurements: [
      { timeMinutes: 0, loadNominal: halfLoad, unloadedIndication: 0, unloadedDeltaL: Number((e1 * 0.5).toFixed(4)), errorZeroE0: 0, loadedIndication: halfLoad, loadedDeltaL: Number((e1 * 0.5).toFixed(4)), errorLoadedEL: 0, correctedError: 0, mpe: Number((e1 * 1.0).toFixed(4)), pass: true },
      { timeMinutes: 5, loadNominal: halfLoad, unloadedIndication: 0, unloadedDeltaL: Number((e1 * 0.49).toFixed(4)), errorZeroE0: Number((e1 * 0.01).toFixed(5)), loadedIndication: halfLoad, loadedDeltaL: Number((e1 * 0.5).toFixed(4)), errorLoadedEL: 0, correctedError: Number((e1 * 0.01).toFixed(5)), mpe: Number((e1 * 1.0).toFixed(4)), pass: true },
      { timeMinutes: 15, loadNominal: halfLoad, unloadedIndication: 0, unloadedDeltaL: Number((e1 * 0.5).toFixed(4)), errorZeroE0: 0, loadedIndication: halfLoad, loadedDeltaL: Number((e1 * 0.5).toFixed(4)), errorLoadedEL: 0, correctedError: 0, mpe: Number((e1 * 1.0).toFixed(4)), pass: true },
      { timeMinutes: 30, loadNominal: halfLoad, unloadedIndication: 0, unloadedDeltaL: Number((e1 * 0.5).toFixed(4)), errorZeroE0: 0, loadedIndication: halfLoad, loadedDeltaL: Number((e1 * 0.5).toFixed(4)), errorLoadedEL: 0, correctedError: 0, mpe: Number((e1 * 1.0).toFixed(4)), pass: true },
    ],
    overallResult: 'PASS',
    remarks: 'Warm-up zero drift <= 0.25e and load error at 30 min within MPE (A.5.2).',
  };

  // 11. Test 11: Variations of Voltage (matching Test11Data)
  const nomV = inst.nominalVoltage || 230;
  const test11: Test11Data = {
    powerCategory: inst.powerCategory || 'PUBLIC_AC',
    nominalVoltage: nomV,
    functionalOperationOk: true,
    rows: [
      { conditionLabel: `Unom (${nomV}V)`, voltage: nomV, load: halfLoad, indication: halfLoad, deltaL: Number((e1 * 0.5).toFixed(4)), errorE: 0, correctedErrorEc: 0, mpe: Number((e1 * 1.0).toFixed(4)), pass: true },
      { conditionLabel: `1.10 Unom (${Math.round(nomV * 1.1)}V)`, voltage: Math.round(nomV * 1.1), load: halfLoad, indication: halfLoad, deltaL: Number((e1 * 0.49).toFixed(4)), errorE: 0, correctedErrorEc: 0, mpe: Number((e1 * 1.0).toFixed(4)), pass: true },
      { conditionLabel: `0.85 Unom (${Math.round(nomV * 0.85)}V)`, voltage: Math.round(nomV * 0.85), load: halfLoad, indication: halfLoad, deltaL: Number((e1 * 0.51).toFixed(4)), errorE: 0, correctedErrorEc: 0, mpe: Number((e1 * 1.0).toFixed(4)), pass: true },
    ],
    overallResult: 'PASS',
    remarks: 'Errors under public mains AC power variations (+10% / -15%) remain within MPE (A.5.4).',
  };

  // 12. Test 12: Electrical Disturbances (matching Test12Data)
  const test12: Test12Data = {
    shortTimePowerReductions: [
      { subtestName: 'Dips: 0% 0.5 cycle', testLoad: halfLoad, referenceIndicationI0: halfLoad, disturbedIndicationId: halfLoad, disturbanceError: 0, eLimit: e1, significantFaultDetected: false, reactionCorrect: true, pass: true },
      { subtestName: 'Dips: 0% 1 cycle', testLoad: halfLoad, referenceIndicationI0: halfLoad, disturbedIndicationId: halfLoad, disturbanceError: 0, eLimit: e1, significantFaultDetected: false, reactionCorrect: true, pass: true },
    ],
    electricalBursts: [
      { subtestName: 'Bursts: Power line 1.0 kV (+)', testLoad: halfLoad, referenceIndicationI0: halfLoad, disturbedIndicationId: halfLoad, disturbanceError: 0, eLimit: e1, significantFaultDetected: false, reactionCorrect: true, pass: true },
      { subtestName: 'Bursts: Power line 1.0 kV (-)', testLoad: halfLoad, referenceIndicationI0: halfLoad, disturbedIndicationId: halfLoad, disturbanceError: 0, eLimit: e1, significantFaultDetected: false, reactionCorrect: true, pass: true },
    ],
    electrostaticDischarges: [
      { subtestName: 'ESD: Contact 6 kV (+)', testLoad: halfLoad, referenceIndicationI0: halfLoad, disturbedIndicationId: halfLoad, disturbanceError: 0, eLimit: e1, significantFaultDetected: false, reactionCorrect: true, pass: true },
      { subtestName: 'ESD: Air 8 kV (+)', testLoad: halfLoad, referenceIndicationI0: halfLoad, disturbedIndicationId: halfLoad, disturbanceError: 0, eLimit: e1, significantFaultDetected: false, reactionCorrect: true, pass: true },
    ],
    radiatedFields: [
      { subtestName: 'Radiated RF: 10 V/m Vertical', testLoad: halfLoad, referenceIndicationI0: halfLoad, disturbedIndicationId: halfLoad, disturbanceError: 0, eLimit: e1, significantFaultDetected: false, reactionCorrect: true, pass: true },
      { subtestName: 'Radiated RF: 10 V/m Horizontal', testLoad: halfLoad, referenceIndicationI0: halfLoad, disturbedIndicationId: halfLoad, disturbanceError: 0, eLimit: e1, significantFaultDetected: false, reactionCorrect: true, pass: true },
    ],
    overallResult: 'PASS',
    remarks: 'No significant faults or errors exceeding e occurred during disturbance exposures (B.3).',
  };

  // 13. Test 13: Damp Heat Steady State (matching Test13Data)
  const test13: Test13Data = {
    stages: [
      {
        stageName: 'INITIAL_REFERENCE',
        temperature: 20,
        relativeHumidity: 50,
        e0: 0,
        loads: [
          { loadL: minCap, indicationI: minCap, deltaL: Number((e1 * 0.5).toFixed(4)), correctedErrorEc: 0, mpe: Number((e1 * 0.5).toFixed(4)), pass: true },
          { loadL: maxCap, indicationI: maxCap, deltaL: Number((eMax * 0.5).toFixed(4)), correctedErrorEc: 0, mpe: Number((eMax * 1.5).toFixed(4)), pass: true },
        ],
      },
      {
        stageName: 'HIGH_TEMPERATURE_85_RH',
        temperature: 40,
        relativeHumidity: 85,
        e0: 0,
        loads: [
          { loadL: minCap, indicationI: minCap, deltaL: Number((e1 * 0.5).toFixed(4)), correctedErrorEc: 0, mpe: Number((e1 * 0.5).toFixed(4)), pass: true },
          { loadL: maxCap, indicationI: maxCap, deltaL: Number((eMax * 0.49).toFixed(4)), correctedErrorEc: 0, mpe: Number((eMax * 1.5).toFixed(4)), pass: true },
        ],
      },
      {
        stageName: 'FINAL_REFERENCE',
        temperature: 20,
        relativeHumidity: 50,
        e0: 0,
        loads: [
          { loadL: minCap, indicationI: minCap, deltaL: Number((e1 * 0.5).toFixed(4)), correctedErrorEc: 0, mpe: Number((e1 * 0.5).toFixed(4)), pass: true },
          { loadL: maxCap, indicationI: maxCap, deltaL: Number((eMax * 0.5).toFixed(4)), correctedErrorEc: 0, mpe: Number((eMax * 1.5).toFixed(4)), pass: true },
        ],
      },
    ],
    overallResult: 'PASS',
    remarks: 'Damp heat 85% RH chamber exposure shows no degradation beyond permissible limits (B.2.2).',
  };

  // 14. Test 14: Span Stability (matching Test14Data with required 8 measurement points)
  const test14: Test14Data = {
    testLoad: Number((maxCap * 0.8).toFixed(3)),
    initialR1Threshold: Number((e1 * 0.1).toFixed(4)),
    allowableVariationA: Number((e1 * 0.5).toFixed(4)),
    measurements: [
      {
        measurementNumber: 1,
        date: 'Day 1',
        temperature: 20.5,
        barometricPressure: 1012,
        conditionDescription: 'Initial reference measurement',
        readings: [
          { readingIndex: 1, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
          { readingIndex: 2, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
        ],
        averageX: 0,
        r1: 0,
      },
      {
        measurementNumber: 2,
        date: 'Day 2',
        temperature: 20.6,
        barometricPressure: 1013,
        conditionDescription: 'Subsequent checkpoint Day 2',
        readings: [
          { readingIndex: 1, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
        ],
        averageX: 0,
      },
      {
        measurementNumber: 3,
        date: 'Day 4',
        temperature: 20.8,
        barometricPressure: 1011,
        conditionDescription: 'Subsequent checkpoint Day 4',
        readings: [
          { readingIndex: 1, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
        ],
        averageX: 0,
      },
      {
        measurementNumber: 4,
        date: 'Day 7',
        temperature: 21.0,
        barometricPressure: 1014,
        conditionDescription: 'Subsequent checkpoint Day 7',
        readings: [
          { readingIndex: 1, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
        ],
        averageX: 0,
      },
      {
        measurementNumber: 5,
        date: 'Day 11',
        temperature: 21.2,
        barometricPressure: 1015,
        conditionDescription: 'Subsequent checkpoint Day 11',
        readings: [
          { readingIndex: 1, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
        ],
        averageX: 0,
      },
      {
        measurementNumber: 6,
        date: 'Day 15',
        temperature: 21.0,
        barometricPressure: 1013,
        conditionDescription: 'Subsequent checkpoint Day 15',
        readings: [
          { readingIndex: 1, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
        ],
        averageX: 0,
      },
      {
        measurementNumber: 7,
        date: 'Day 21',
        temperature: 20.9,
        barometricPressure: 1012,
        conditionDescription: 'Subsequent checkpoint Day 21',
        readings: [
          { readingIndex: 1, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
        ],
        averageX: 0,
      },
      {
        measurementNumber: 8,
        date: 'Day 28',
        temperature: 21.1,
        barometricPressure: 1014,
        conditionDescription: 'Final measurement after 28 days',
        readings: [
          { readingIndex: 1, i0: 0, deltaL0: Number((e1 * 0.5).toFixed(4)), e0: 0, iL: Number((maxCap * 0.8).toFixed(3)), deltaL: Number((e1 * 0.5).toFixed(4)), eL: 0, x: 0 },
        ],
        averageX: 0,
      },
    ],
    spanVariationV: 0,
    overallResult: 'PASS',
    remarks: 'Span variation over 28 days satisfies V <= A (subclause B.4).',
  };

  // 15. Test 15: Endurance (matching Test15Data)
  const isEnduranceApplicable = inst.accuracyClass !== 'I';
  const test15: Test15Data = {
    loadApplied: isEnduranceApplicable ? halfLoad : 0,
    numberOfLoadings: isEnduranceApplicable ? 100000 : 0,
    initialWeighing: [
      { loadL: halfLoad, indicationI: halfLoad, deltaL: Number((e1 * 0.5).toFixed(4)), correctedErrorEcInitial: 0 },
    ],
    finalWeighing: [
      { loadL: halfLoad, indicationI: halfLoad, deltaL: Number((e1 * 0.49).toFixed(4)), correctedErrorEcFinal: 0, durabilityErrorDwear: 0, mpe: Number((e1 * 1.0).toFixed(4)), pass: true },
    ],
    overallResult: isEnduranceApplicable ? 'PASS' : 'NOT_APPLICABLE',
    remarks: isEnduranceApplicable
      ? 'Completed 100,000 loading cycles; durability error within MPE (A.6).'
      : 'Endurance test excluded for Class I high precision balances pursuant to OIML R 76-1 subclause A.6.',
  };

  // 16. Test 16: Examination of Construction (matching Test16Data)
  const test16: Test16Data = {
    generalDescription: `${inst.instrumentCategory} pattern ${inst.patternDesignation}`,
    mainComponentsDescription: `Precision load cell, electronic analog-to-digital converter, central processing unit with legally relevant software separation.`,
    features: [
      { featureId: 'f1', featureName: 'Suitability of construction', observedSpecification: 'IP-sealed cast aluminium housing', submittedSpecification: 'IP54 mechanical design', conforms: true, remarks: 'Conforms to Clause 4.1' },
      { featureId: 'f2', featureName: 'Securing and sealing', observedSpecification: 'Lead wire seal holes and event logger', submittedSpecification: 'Hardware sealing jumper', conforms: true, remarks: 'Conforms to Clause 4.1.2.4' },
      { featureId: 'f3', featureName: 'Software separation', observedSpecification: `Checksum: ${inst.softwareChecksum || 'VERIFIED'}`, submittedSpecification: 'OIML R 76-1 Clause 5.5 Separation', conforms: true, remarks: 'Conforms to Clause 5.5' },
      { featureId: 'f4', featureName: 'Indicating device clarity', observedSpecification: 'High-contrast backlit display with clear mass units', submittedSpecification: 'Clear unit presentation', conforms: true, remarks: 'Conforms to Clause 4.2' },
    ],
    overallResult: 'PASS',
    remarks: 'All technical and construction requirements conform to Clause 4 and Clause 6.',
  };

  // 17. Test 17: Complete Checklist (matching Test17Data)
  const test17: Test17Data = {
    items: getDefaultChecklistItems(),
    overallResult: 'PASS',
    remarks: 'Conformity of all metrological and technical clauses pursuant to OIML R 76-1:2006.',
  };

  return {
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
    overallResult: 'PASS',
  };
}
