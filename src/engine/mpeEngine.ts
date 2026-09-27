/**
 * Central OIML R76 Table 6 Maximum Permissible Error (MPE) Engine
 * Implements exact decimal metrological calculations.
 */

import Decimal from 'decimal.js';
import { AccuracyClass, RangeSpecification } from '../types/metrology';

// Configure Decimal precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface MPEResult {
  load: Decimal;
  applicableE: Decimal;
  m: Decimal; // verification scale intervals: m = L / e
  mpeFactor: Decimal; // 0.5, 1.0, 1.5
  mpeUnits: Decimal; // MPE in physical units: mpeFactor * applicableE
  rangeIndex: number;
  explanation: string;
}

/**
 * Resolves the applicable verification scale interval 'e' for a given load
 * taking multi-interval and multiple-range instruments into account.
 */
export function resolveApplicableRange(
  loadValue: Decimal | number,
  ranges: RangeSpecification[]
): { applicableRange: RangeSpecification; rangeIndex: number } {
  const load = new Decimal(loadValue).abs();

  if (!ranges || ranges.length === 0) {
    throw new Error('Instrument must have at least one range specification');
  }

  // Sort ranges by Max ascending
  const sorted = [...ranges].sort((a, b) => a.max - b.max);

  // For multi-interval: find first range where load <= Max_i
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (load.lessThanOrEqualTo(new Decimal(r.max))) {
      return { applicableRange: r, rangeIndex: r.rangeIndex };
    }
  }

  // If load exceeds highest Max, use highest range
  const highest = sorted[sorted.length - 1];
  return { applicableRange: highest, rangeIndex: highest.rangeIndex };
}

/**
 * Calculates MPE according to OIML R 76 Table 6:
 *
 * Class I:
 *   0 <= m <= 50 000        : +/- 0.5 e
 *   50 000 < m <= 200 000   : +/- 1.0 e
 *   m > 200 000             : +/- 1.5 e
 *
 * Class II:
 *   0 <= m <= 5 000         : +/- 0.5 e
 *   5 000 < m <= 20 000     : +/- 1.0 e
 *   m > 20 000              : +/- 1.5 e
 *
 * Class III:
 *   0 <= m <= 500           : +/- 0.5 e
 *   500 < m <= 2 000        : +/- 1.0 e
 *   m > 2 000               : +/- 1.5 e
 *
 * Class IIII:
 *   0 <= m <= 50            : +/- 0.5 e
 *   50 < m <= 200           : +/- 1.0 e
 *   m > 200                 : +/- 1.5 e
 */
export function calculateMPE(
  loadValue: Decimal | number,
  accuracyClass: AccuracyClass,
  ranges: RangeSpecification[]
): MPEResult {
  const load = new Decimal(loadValue);
  const absLoad = load.abs();
  const { applicableRange, rangeIndex } = resolveApplicableRange(absLoad, ranges);
  const e = new Decimal(applicableRange.e);

  if (e.isZero()) {
    throw new Error('Verification scale interval (e) cannot be zero');
  }

  // Number of verification scale intervals: m = L / e
  const m = absLoad.dividedBy(e);

  let mpeFactor: Decimal;
  let ruleBracket = '';

  switch (accuracyClass) {
    case 'I':
      if (m.lessThanOrEqualTo(new Decimal(50000))) {
        mpeFactor = new Decimal(0.5);
        ruleBracket = '0 ≤ m ≤ 50 000 e (±0.5 e)';
      } else if (m.lessThanOrEqualTo(new Decimal(200000))) {
        mpeFactor = new Decimal(1.0);
        ruleBracket = '50 000 < m ≤ 200 000 e (±1.0 e)';
      } else {
        mpeFactor = new Decimal(1.5);
        ruleBracket = 'm > 200 000 e (±1.5 e)';
      }
      break;

    case 'II':
      if (m.lessThanOrEqualTo(new Decimal(5000))) {
        mpeFactor = new Decimal(0.5);
        ruleBracket = '0 ≤ m ≤ 5 000 e (±0.5 e)';
      } else if (m.lessThanOrEqualTo(new Decimal(20000))) {
        mpeFactor = new Decimal(1.0);
        ruleBracket = '5 000 < m ≤ 20 000 e (±1.0 e)';
      } else {
        mpeFactor = new Decimal(1.5);
        ruleBracket = 'm > 20 000 e (±1.5 e)';
      }
      break;

    case 'III':
      if (m.lessThanOrEqualTo(new Decimal(500))) {
        mpeFactor = new Decimal(0.5);
        ruleBracket = '0 ≤ m ≤ 500 e (±0.5 e)';
      } else if (m.lessThanOrEqualTo(new Decimal(2000))) {
        mpeFactor = new Decimal(1.0);
        ruleBracket = '500 < m ≤ 2 000 e (±1.0 e)';
      } else {
        mpeFactor = new Decimal(1.5);
        ruleBracket = 'm > 2 000 e (±1.5 e)';
      }
      break;

    case 'IIII':
      if (m.lessThanOrEqualTo(new Decimal(50))) {
        mpeFactor = new Decimal(0.5);
        ruleBracket = '0 ≤ m ≤ 50 e (±0.5 e)';
      } else if (m.lessThanOrEqualTo(new Decimal(200))) {
        mpeFactor = new Decimal(1.0);
        ruleBracket = '50 < m ≤ 200 e (±1.0 e)';
      } else {
        mpeFactor = new Decimal(1.5);
        ruleBracket = 'm > 200 e (±1.5 e)';
      }
      break;

    default:
      throw new Error(`Unknown accuracy class: ${accuracyClass}`);
  }

  const mpeUnits = mpeFactor.times(e);

  const explanation = `Class ${accuracyClass}, Range ${rangeIndex} (e = ${e.toString()}): m = L / e = ${absLoad.toString()} / ${e.toString()} = ${m.toFixed(2)} e. Tier: ${ruleBracket} => MPE = ±${mpeUnits.toString()}`;

  return {
    load: absLoad,
    applicableE: e,
    m,
    mpeFactor,
    mpeUnits,
    rangeIndex,
    explanation,
  };
}
