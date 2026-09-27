/**
 * OIML R 76 Legal Metrology Core Data Models and Definitions
 * Non-Automatic Weighing Instruments (NAWIs)
 */

export type UserRole = 'ADMIN' | 'REVIEWER';

export type AccuracyClass = 'I' | 'II' | 'III' | 'IIII';

export type ResultState = 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_APPLICABLE';

export type ReportStatus = 'DRAFT' | 'IN_REVIEW' | 'COMPLETED' | 'APPROVED' | 'FINAL';

export type PowerCategory = 
  | 'PUBLIC_AC'
  | 'EXTERNAL_AC_DC'
  | 'BATTERY_RECHARGEABLE_IN_OPERATION'
  | 'BATTERY_NON_RECHARGEABLE'
  | 'VEHICLE_12V'
  | 'VEHICLE_24V';

export type InstrumentType = 'COMPLETE' | 'MODULE';
export type IndicatingType = 'SELF_INDICATING' | 'SEMI_SELF_INDICATING' | 'NON_SELF_INDICATING';
export type RangeType = 'SINGLE_RANGE' | 'MULTI_INTERVAL' | 'MULTIPLE_RANGE';

export interface RangeSpecification {
  rangeIndex: number; // 1, 2, 3
  max: number;        // in kg or g
  min: number;        // in kg or g
  e: number;          // verification scale interval in kg or g
  d: number;          // actual scale interval in kg or g
  n: number;          // verification scale intervals: n = Max / e
}

export interface Instrument {
  id: string;
  applicationNumber: string;
  patternDesignation: string;
  manufacturer: string;
  applicant: string;
  instrumentCategory: string; // e.g. "Electronic Platform Scale", "Analytical Balance", "Weighbridge", "Price Computing Scale"
  instrumentType: InstrumentType;
  accuracyClass: AccuracyClass;
  indicatingType: IndicatingType;
  rangeType: RangeType;
  ranges: RangeSpecification[];
  units: string; // 'kg', 'g', 'mg'
  powerCategory: PowerCategory;
  nominalVoltage: number; // e.g. 230V or 12V
  voltageMin?: number;
  voltageMax?: number;
  frequency?: number;     // e.g. 50 Hz
  batteryVoltage?: number;
  manufacturerLowerVoltageLimit?: number; // UMO
  temperatureMin: number; // e.g. -10 °C or 10 °C
  temperatureMax: number; // e.g. +40 °C or 30 °C
  initialZeroSettingRangePercent: number; // e.g. 4% or 20%
  tareMax: number;
  tareType: 'SUBTRACTIVE' | 'ADDITIVE' | 'BOTH' | 'NONE';
  hasLevelIndicator: boolean;
  tiltLimitPercent?: number; // e.g. 0.2% or 5%
  isDirectSales: boolean;
  hasPriceComputing: boolean;
  isElectronic: boolean;
  hasSoftware: boolean;
  softwareVersion?: string;
  softwareChecksum?: string;
  serialNumber: string;
  identificationNumber: string;
  loadCellManufacturer?: string;
  loadCellType?: string;
  loadCellCapacity?: number;
  loadCellClassification?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegulatoryRuleVersion {
  id: string;
  name: string;
  code: string;
  version: string;
  effectiveDate: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'DRAFT';
  description: string;
  mpeTableVersion: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadTime: string;
  uploaderRole: UserRole;
  checksumSha256: string;
  reportId: string;
  testId?: string;
  description: string;
  url?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorRole: UserRole;
  actorIdentifier: string;
  entityType: 'REPORT' | 'INSTRUMENT' | 'OBSERVATION' | 'RULE' | 'ATTACHMENT' | 'SECURITY';
  entityId: string;
  details: string;
  metadata?: Record<string, any>;
}

// ----------------------
// Test 1: Weighing Performance (A.4.4 / A.5.3.1)
// ----------------------
export interface Test1Observation {
  load: number;          // Applied load L
  direction: 'UP' | 'DOWN';
  indication: number;    // Indication I
  deltaL: number;        // Additional test-load ΔL to next changeover point
  p?: number;            // Conventional true value P = I + e/2 - ΔL
  error?: number;        // E = P - L
  correctedError?: number; // Ec = E - E0
  m?: number;            // m = L / e
  mpe?: number;          // Absolute MPE value
  pass?: boolean;
}

export interface Test1Data {
  ambientTemp: number;
  relativeHumidity: number;
  barometricPressure?: number;
  e0: number; // Error at or near zero
  initialZeroSettingOver20Percent: boolean;
  supplementaryZeroTested?: boolean;
  observations: Test1Observation[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 2: Temperature Effect on No-load Indication (A.5.3.2)
// ----------------------
export interface Test2TemperaturePoint {
  temperature: number; // °C
  time: string;
  zeroIndication: number; // I
  deltaL: number;         // ΔL
  p?: number;             // P = I + e/2 - ΔL
  deltaP?: number;        // P_i - P_(i-1)
  deltaT?: number;        // T_i - T_(i-1)
  zeroChangePerRefTemp?: number; // |ΔP|/|ΔT| (Class I) or |ΔP|*5/|ΔT| (Classes II, III, IIII)
  limit?: number;         // e
  pass?: boolean;
}

export interface Test2Data {
  points: Test2TemperaturePoint[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 3: Eccentricity (A.4.7)
// ----------------------
export interface Test3WeightPosition {
  positionNumber: number; // 1 (center), 2 (front-left), 3 (rear-left), 4 (rear-right), 5 (front-right)
  positionName: string;
  load: number;           // L = (Max + T_max) / 3 (for <= 4 supports)
  indication: number;     // I
  deltaL: number;         // ΔL
  e0: number;             // zero error prior to measurement
  p?: number;
  error?: number;
  correctedError?: number;
  mpe?: number;
  pass?: boolean;
}

export interface Test3RollingLoadPosition {
  positionNumber: number; // 1, 2, 3 forward & backward
  positionName: string;
  load: number;
  indication: number;
  deltaL: number;
  e0: number;
  correctedError?: number;
  mpe?: number;
  pass?: boolean;
}

export interface Test3Data {
  method: 'WEIGHTS' | 'ROLLING_LOAD';
  numberOfSupports: number;
  calculatedLoad: number;
  weightPositions: Test3WeightPosition[];
  rollingPositions?: Test3RollingLoadPosition[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 4: Discrimination & Sensitivity (A.4.8 / A.4.9)
// ----------------------
export interface Test4DigitalRow {
  load: number;
  indication1: number; // I1
  deltaLRemoved: number; // ΔL
  extraLoad: number;    // 1.4 d
  indication2: number; // I2
  difference?: number; // I2 - I1
  requiredD: number;   // d
  pass?: boolean;
}

export interface Test4AnalogRow {
  load: number;
  indication1: number;
  extraLoad: number; // = MPE
  indication2: number;
  difference?: number;
  requiredDiff?: number; // >= 0.7 * extraLoad
  pass?: boolean;
}

export interface Test4NonSelfRow {
  load: number;
  indication: number;
  extraLoad: number; // max(0.4 * MPE, 1mg)
  visibleMovement: boolean;
  pass?: boolean;
}

export interface Test4SensitivityRow {
  load: number;
  extraLoad: number; // = MPE
  displacementMm: number; // Measured displacement
  requiredDisplacementMm: number; // 1mm, 2mm, 5mm
  pass?: boolean;
}

export interface Test4Data {
  mode: 'DIGITAL' | 'ANALOG' | 'NON_SELF_INDICATING';
  digitalRows?: Test4DigitalRow[];
  analogRows?: Test4AnalogRow[];
  nonSelfRows?: Test4NonSelfRow[];
  sensitivityRows?: Test4SensitivityRow[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 5: Repeatability (A.4.10)
// ----------------------
export interface Test5WeighingSeries {
  loadNominal: number; // ~50% Max or ~100% Max
  seriesLabel: string; // 'Around 50% Max' or 'Close to 100% Max'
  weighings: {
    index: number;
    indication: number;
    deltaL: number;
    p?: number;
    error?: number;
    passIndividual?: boolean;
  }[];
  pMax?: number;
  pMin?: number;
  rangeR?: number; // R = Pmax - Pmin (or Emax - Emin)
  mpe?: number;
  rangePass?: boolean;
}

export interface Test5Data {
  series50: Test5WeighingSeries;
  series100: Test5WeighingSeries;
  requiredCount: number; // 10 if Max < 1000kg, 3 if Max >= 1000kg
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 6: Time-Dependence (A.4.11)
// ----------------------
export interface Test6Data {
  // 6.1 Zero Return
  loadNominal: number; // close to Max
  indication0: number; // I0 before loading
  deltaL0: number;
  p0?: number;
  indication30: number; // I30 immediately after unloading at 30 min
  deltaL30: number;
  p30?: number;
  deltaZeroReturn?: number; // |P30 - P0|
  limitZeroReturn?: number; // 0.5 * e
  zeroReturnPass?: boolean;
  lowestRangeZeroVariation5Min?: number; // For multiple range: <= e1
  // 6.2 Creep
  creepReadings: {
    timeMinutes: number; // 0, 5, 15, 30, (60, 120, 180, 240)
    indication: number;
    deltaL: number;
    p?: number;
    deltaP?: number; // P(t) - P(0)
    limit?: number;
    pass?: boolean;
  }[];
  creepTerminatedAt30Min?: boolean;
  creepPass?: boolean;
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 7: Stability of Equilibrium (A.4.12)
// ----------------------
export interface Test7Data {
  load: number;
  // Printing / data storage tests (5 repetitions)
  printingTests: {
    repetition: number;
    printedValue: number;
    minDuring5s: number;
    maxDuring5s: number;
    dStab?: number; // max - min
    pass?: boolean; // dStab <= e
  }[];
  // Disturbed zero setting / tare balancing accuracy tests
  zeroSettingAccuracyTests: {
    repetition: number;
    indication: number;
    deltaL: number;
    errorE0?: number;
    pass?: boolean; // <= 0.25 e
  }[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 8: Tilting (A.5.1, A.5.2, A.5.3)
// ----------------------
export interface Test8DirectionMeasurement {
  direction: 'REFERENCE' | 'LONGITUDINAL_POS' | 'LONGITUDINAL_NEG' | 'TRANSVERSE_POS' | 'TRANSVERSE_NEG';
  tiltAmount: string; // e.g. "0.2%" or "5%"
  // No-load
  i0: number;
  deltaL0: number;
  e0?: number;
  deltaE0VsRef?: number; // |E0tilt - E0ref|
  noLoadPass?: boolean;  // <= 2e
  // Load 1 (lowest MPE change point)
  load1: number;
  i1: number;
  deltaL1: number;
  ec1?: number;
  dtilt1?: number; // |Ec1_ref - Ec1_tilt|
  mpe1?: number;
  loadedPass1?: boolean;
  // Load 2 (Max)
  load2: number;
  i2: number;
  deltaL2: number;
  ec2?: number;
  dtilt2?: number; // |Ec2_ref - Ec2_tilt|
  mpe2?: number;
  loadedPass2?: boolean;
}

export interface Test8Data {
  tiltCondition: 'TILTING_0_2_PERCENT' | 'TILTING_LIMITING_VALUE' | 'TILTING_5_PERCENT_NO_INDICATOR';
  measurements: Test8DirectionMeasurement[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 9: Tare (Weighing Test) (A.4.6.1)
// ----------------------
export interface Test9TareStep {
  tareValue: number;
  tareIndication: number;
  tareType: 'SUBTRACTIVE' | 'ADDITIVE';
  e0: number; // error at or near zero with tare applied
  netLoadSteps: {
    netLoadL: number;
    indicationI: number;
    deltaL: number;
    p?: number;
    errorE?: number;
    correctedErrorEc?: number;
    mpeNet?: number; // Evaluated on NET LOAD
    pass?: boolean;
  }[];
}

export interface Test9Data {
  tareSteps: Test9TareStep[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 10: Warm-Up Time (A.5.2)
// ----------------------
export interface Test10Measurement {
  timeMinutes: number; // 0, 5, 15, 30
  loadNominal: number; // close to Max
  unloadedIndication: number;
  unloadedDeltaL: number;
  errorZeroE0?: number;
  loadedIndication: number;
  loadedDeltaL: number;
  errorLoadedEL?: number;
  correctedError?: number; // |EL - E0|
  mpe?: number;
  pass?: boolean;
}

export interface Test10Data {
  disconnectionDurationHours: number; // >= 8 hours
  noResultDuringWarmupPeriodVerified: boolean;
  measurements: Test10Measurement[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 11: Variations of Voltage (A.5.4)
// ----------------------
export interface Test11VoltageRow {
  conditionLabel: string; // e.g. "Unom (230V)", "0.85 Unom (195.5V)", "1.10 Unom (253V)"
  voltage: number;
  load: number; // 10e or 0.5-1.0 Max
  indication: number;
  deltaL: number;
  errorE?: number;
  correctedErrorEc?: number;
  mpe?: number;
  pass?: boolean;
}

export interface Test11Data {
  powerCategory: PowerCategory;
  nominalVoltage: number;
  rows: Test11VoltageRow[];
  functionalOperationOk: boolean;
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 12: Electrical Disturbances / EMC (B.3)
// ----------------------
export interface Test12SubtestRow {
  subtestName: string; // e.g. "Dips: 0% 0.5 cycle", "Bursts: Power supply 1 kV (+)", "ESD: Contact 6 kV (+)", "Radiated RF: 10 V/m Vertical Front"
  testLoad: number;
  referenceIndicationI0: number;
  disturbedIndicationId: number;
  disturbanceError?: number; // |Id - I0|
  eLimit: number;            // e
  significantFaultDetected: boolean;
  reactionCorrect: boolean;  // automatic blank / alarm / inhibit
  pass?: boolean;
  remarks?: string;
}

export interface Test12Data {
  shortTimePowerReductions: Test12SubtestRow[];
  electricalBursts: Test12SubtestRow[];
  electrostaticDischarges: Test12SubtestRow[];
  radiatedFields: Test12SubtestRow[];
  conductedRf?: Test12SubtestRow[];
  vehicleTransients?: Test12SubtestRow[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 13: Damp Heat, Steady State (B.2.2)
// ----------------------
export interface Test13Stage {
  stageName: 'INITIAL_REFERENCE' | 'HIGH_TEMPERATURE_85_RH' | 'FINAL_REFERENCE';
  temperature: number; // e.g. 20 °C, 40 °C, 20 °C
  relativeHumidity: number; // 50%, 85%, 50%
  e0: number;
  loads: {
    loadL: number;
    indicationI: number;
    deltaL: number;
    correctedErrorEc?: number;
    mpe?: number;
    pass?: boolean;
  }[];
}

export interface Test13Data {
  stages: Test13Stage[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 14: Span Stability (B.4)
// ----------------------
export interface Test14MeasurementPoint {
  measurementNumber: number; // 1 (initial), 2...8 (subsequent)
  date: string;
  temperature: number;
  barometricPressure: number;
  conditionDescription: string;
  readings: {
    readingIndex: number;
    i0: number;
    deltaL0: number;
    e0?: number;
    iL: number;
    deltaL: number;
    eL?: number;
    x?: number; // eL - e0
  }[];
  averageX?: number;
  r1?: number; // For initial measurement
}

export interface Test14Data {
  testLoad: number; // near Max
  initialR1Threshold: number; // 0.1 e
  allowableVariationA: number; // max(0.5e, 0.5 * |MPE|)
  measurements: Test14MeasurementPoint[];
  spanVariationV?: number; // max(X) - min(X)
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 15: Endurance (A.6)
// ----------------------
export interface Test15Data {
  loadApplied: number; // ~0.5 Max
  numberOfLoadings: number; // exactly 100,000
  initialWeighing: {
    loadL: number;
    indicationI: number;
    deltaL: number;
    correctedErrorEcInitial?: number;
  }[];
  finalWeighing: {
    loadL: number;
    indicationI: number;
    deltaL: number;
    correctedErrorEcFinal?: number;
    durabilityErrorDwear?: number; // |Ec_initial - Ec_final|
    mpe?: number;
    pass?: boolean;
  }[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 16: Examination of the Construction (Clause 4 & 6)
// ----------------------
export interface Test16FeatureCheck {
  featureId: string;
  featureName: string;
  observedSpecification: string;
  submittedSpecification: string;
  conforms: boolean; // C(d) = 1 or 0
  remarks?: string;
}

export interface Test16Data {
  generalDescription: string;
  mainComponentsDescription: string;
  photographsOrSketchesUrl?: string;
  features: Test16FeatureCheck[];
  overallResult: ResultState;
  remarks?: string;
}

// ----------------------
// Test 17: Complete Checklist (Clause 3, 4, 5, 7)
// ----------------------
export interface ChecklistItem {
  id: string;
  clause: string;
  category: 'ALL_TYPES' | 'DIRECT_SALES' | 'ELECTRONIC' | 'SOFTWARE';
  requirement: string;
  applicable: boolean;
  status: ResultState; // PASS, FAIL, INCOMPLETE, NOT_APPLICABLE
  remarks?: string;
}

export interface Test17Data {
  items: ChecklistItem[];
  overallResult: ResultState;
  remarks?: string;
}

// Master Evaluation Report
export interface EvaluationReport {
  id: string;
  reportNumber: string;
  instrumentId: string;
  instrument: Instrument;
  ruleVersionId: string;
  ruleVersion: RegulatoryRuleVersion;
  status: ReportStatus;
  evaluationPeriodStart: string;
  evaluationPeriodEnd: string;
  observerName: string;
  reviewerName?: string;
  reviewerNotes?: string;
  reviewerDecision?: 'RECOMMEND_APPROVAL' | 'REVISE_REQUIRED' | 'REJECT';
  reviewerDecisionDate?: string;
  // Tests 1 - 17 data
  test1?: Test1Data;
  test2?: Test2Data;
  test3?: Test3Data;
  test4?: Test4Data;
  test5?: Test5Data;
  test6?: Test6Data;
  test7?: Test7Data;
  test8?: Test8Data;
  test9?: Test9Data;
  test10?: Test10Data;
  test11?: Test11Data;
  test12?: Test12Data;
  test13?: Test13Data;
  test14?: Test14Data;
  test15?: Test15Data;
  test16?: Test16Data;
  test17?: Test17Data;
  // Summary
  overallResult: ResultState;
  summaryRemarks?: string;
  attachments: Attachment[];
  auditHistory: AuditLogEntry[];
  // Cryptographic Signature
  signature?: {
    isSigned: boolean;
    signerRole: UserRole;
    signerName: string;
    signedAt: string;
    reportHashSha256: string;
    algorithm: string;
    certificateSerial?: string;
    verificationStatus: 'VALID' | 'PENDING_INTEGRATION' | 'UNVERIFIED';
  };
  createdAt: string;
  updatedAt: string;
}
