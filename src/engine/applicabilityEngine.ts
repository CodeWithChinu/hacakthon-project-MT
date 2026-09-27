/**
 * OIML R76 Test Applicability Engine
 * Evaluates whether each test genuine applies to an instrument configuration.
 * When a test is not applicable, it is designated NOT_APPLICABLE (never silently treated as PASS).
 */

import Decimal from 'decimal.js';
import { Instrument, ResultState } from '../types/metrology';

export interface TestApplicability {
  testNumber: number;
  testName: string;
  isApplicable: boolean;
  reason: string;
  defaultStatus: ResultState;
}

export function evaluateApplicability(instrument: Instrument): TestApplicability[] {
  const baseE = new Decimal(instrument.ranges[0]?.e || 0);
  const maxCap = new Decimal(instrument.ranges[instrument.ranges.length - 1]?.max || 0);

  const tests: TestApplicability[] = [
    {
      testNumber: 1,
      testName: 'Weighing Performance (A.4.4 / A.5.3.1)',
      isApplicable: true,
      reason: 'Mandatory pattern evaluation test for all non-automatic weighing instruments.',
      defaultStatus: 'INCOMPLETE',
    },
    {
      testNumber: 2,
      testName: 'Temperature Effect on No-load Indication (A.5.3.2)',
      isApplicable: true,
      reason: `Applicable across manufacturer operating temperature range (${instrument.temperatureMin}°C to ${instrument.temperatureMax}°C).`,
      defaultStatus: 'INCOMPLETE',
    },
    {
      testNumber: 3,
      testName: 'Eccentricity (A.4.7)',
      isApplicable: true,
      reason: 'Applicable to verify off-center loading on all load receptor types.',
      defaultStatus: 'INCOMPLETE',
    },
    {
      testNumber: 4,
      testName: 'Discrimination & Sensitivity (A.4.8 / A.4.9)',
      isApplicable: true,
      reason: `Applicable according to indication mode (${instrument.indicatingType}).`,
      defaultStatus: 'INCOMPLETE',
    },
    {
      testNumber: 5,
      testName: 'Repeatability (A.4.10)',
      isApplicable: true,
      reason: `Applicable for all instruments (~50% and ~100% Max, ${maxCap.lessThan(1000) ? '10' : '3'} weighings).`,
      defaultStatus: 'INCOMPLETE',
    },
    {
      testNumber: 6,
      testName: 'Time-Dependence: Zero Return & Creep (A.4.11)',
      isApplicable: instrument.accuracyClass !== 'I',
      reason: instrument.accuracyClass === 'I'
        ? 'Not applicable to Class I instruments (OIML R 76-1, A.4.11).'
        : 'Applicable to Classes II, III, and IIII for zero return and creep.',
      defaultStatus: instrument.accuracyClass === 'I' ? 'NOT_APPLICABLE' : 'INCOMPLETE',
    },
    {
      testNumber: 7,
      testName: 'Stability of Equilibrium (A.4.12)',
      isApplicable: true,
      reason: 'Applicable to test print/storage inhibition and zero/tare accuracy during motion/disturbance.',
      defaultStatus: 'INCOMPLETE',
    },
    {
      testNumber: 8,
      testName: 'Tilting (A.5.1, A.5.2, A.5.3)',
      isApplicable: instrument.hasLevelIndicator || instrument.accuracyClass !== 'I',
      reason: (!instrument.hasLevelIndicator && instrument.accuracyClass === 'I')
        ? 'Not applicable to Class I instruments not liable to tilt without level indicator.'
        : 'Applicable to verify influence of longitudinal and transverse tilt on weighing.',
      defaultStatus: (!instrument.hasLevelIndicator && instrument.accuracyClass === 'I') ? 'NOT_APPLICABLE' : 'INCOMPLETE',
    },
    {
      testNumber: 9,
      testName: 'Tare (Weighing Test) (A.4.6.1)',
      isApplicable: instrument.tareType !== 'NONE' && instrument.tareMax > 0,
      reason: (instrument.tareType !== 'NONE' && instrument.tareMax > 0)
        ? `Applicable: Instrument features ${instrument.tareType.toLowerCase()} tare device (T_max = ${instrument.tareMax} ${instrument.units}).`
        : 'Not applicable: Instrument has no tare device.',
      defaultStatus: (instrument.tareType !== 'NONE' && instrument.tareMax > 0) ? 'INCOMPLETE' : 'NOT_APPLICABLE',
    },
    {
      testNumber: 10,
      testName: 'Warm-Up Time (A.5.2)',
      isApplicable: instrument.isElectronic,
      reason: instrument.isElectronic
        ? 'Applicable to electronic instruments after ≥ 8 h power disconnection.'
        : 'Not applicable to non-powered mechanical instruments.',
      defaultStatus: instrument.isElectronic ? 'INCOMPLETE' : 'NOT_APPLICABLE',
    },
    {
      testNumber: 11,
      testName: 'Variations of Voltage (A.5.4)',
      isApplicable: instrument.isElectronic,
      reason: instrument.isElectronic
        ? `Applicable under power supply category: ${instrument.powerCategory} (Unom = ${instrument.nominalVoltage} V).`
        : 'Not applicable to non-powered mechanical instruments.',
      defaultStatus: instrument.isElectronic ? 'INCOMPLETE' : 'NOT_APPLICABLE',
    },
    {
      testNumber: 12,
      testName: 'Electrical Disturbances / EMC (B.3)',
      isApplicable: instrument.isElectronic,
      reason: instrument.isElectronic
        ? 'Applicable: Dips/interruptions, bursts, ESD, and radiated RF fields for electronic instruments.'
        : 'Not applicable to non-powered mechanical instruments.',
      defaultStatus: instrument.isElectronic ? 'INCOMPLETE' : 'NOT_APPLICABLE',
    },
    {
      testNumber: 13,
      testName: 'Damp Heat, Steady State (B.2.2)',
      isApplicable: !(instrument.accuracyClass === 'I' || (instrument.accuracyClass === 'II' && baseE.lessThan(new Decimal(1)))),
      reason: (instrument.accuracyClass === 'I' || (instrument.accuracyClass === 'II' && baseE.lessThan(new Decimal(1))))
        ? 'Not applicable to Class I instruments or Class II instruments where e < 1 g (OIML R 76-1, B.2.2).'
        : 'Applicable to evaluate influence of high temperature and 85% RH damp heat.',
      defaultStatus: (instrument.accuracyClass === 'I' || (instrument.accuracyClass === 'II' && baseE.lessThan(new Decimal(1)))) ? 'NOT_APPLICABLE' : 'INCOMPLETE',
    },
    {
      testNumber: 14,
      testName: 'Span Stability (B.4)',
      isApplicable: instrument.accuracyClass !== 'I',
      reason: instrument.accuracyClass === 'I'
        ? 'Not applicable to Class I instruments (OIML R 76-1, B.4).'
        : 'Applicable: 28-day span stability evaluation for Classes II, III, IIII.',
      defaultStatus: instrument.accuracyClass === 'I' ? 'NOT_APPLICABLE' : 'INCOMPLETE',
    },
    {
      testNumber: 15,
      testName: 'Endurance (A.6)',
      isApplicable: ['II', 'III', 'IIII'].includes(instrument.accuracyClass) && maxCap.lessThanOrEqualTo(100),
      reason: (['II', 'III', 'IIII'].includes(instrument.accuracyClass) && maxCap.lessThanOrEqualTo(100))
        ? 'Applicable: Class II/III/IIII with Max ≤ 100 kg (100,000 loadings at ~0.5 Max).'
        : `Not applicable: Endurance test restricted to Class II, III, IIII with Max ≤ 100 kg (Current: Class ${instrument.accuracyClass}, Max ${maxCap} kg).`,
      defaultStatus: (['II', 'III', 'IIII'].includes(instrument.accuracyClass) && maxCap.lessThanOrEqualTo(100)) ? 'INCOMPLETE' : 'NOT_APPLICABLE',
    },
    {
      testNumber: 16,
      testName: 'Examination of the Construction of the Instrument (Clause 4 & 6)',
      isApplicable: true,
      reason: 'Mandatory physical and documentary examination of construction and conformity.',
      defaultStatus: 'INCOMPLETE',
    },
    {
      testNumber: 17,
      testName: 'Checklist (Clause 3, 4, 5, 7)',
      isApplicable: true,
      reason: 'Mandatory metrological and technical requirements checklist.',
      defaultStatus: 'INCOMPLETE',
    },
  ];

  return tests;
}
