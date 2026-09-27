/**
 * Instrument Management Component
 * Displays registered NAWIs and provides registration form for Admin.
 */

import React, { useState } from 'react';
import { Instrument, UserRole, AccuracyClass, PowerCategory, RangeType } from '../types/metrology';
import { Layers, Plus, Search, ShieldAlert, CheckCircle, Scale, X } from 'lucide-react';

interface Props {
  instruments: Instrument[];
  role: UserRole;
  onRegisterInstrument: (inst: Partial<Instrument>) => Promise<void>;
  onSelectInstrument?: (inst: Instrument) => void;
}

export const InstrumentListModal: React.FC<Props> = ({
  instruments,
  role,
  onRegisterInstrument,
  onSelectInstrument,
}) => {
  const isAdmin = role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    patternDesignation: '',
    applicationNumber: `APP/${new Date().getFullYear()}/NAWI/${Math.floor(100 + Math.random() * 900)}`,
    manufacturer: '',
    applicant: '',
    instrumentCategory: 'Electronic Platform Scale',
    accuracyClass: 'III' as AccuracyClass,
    rangeType: 'SINGLE_RANGE' as RangeType,
    units: 'kg',
    max1: 15,
    min1: 0.04,
    e1: 0.005,
    d1: 0.005,
    max2: 30,
    e2: 0.01,
    d2: 0.01,
    powerCategory: 'PUBLIC_AC' as PowerCategory,
    nominalVoltage: 230,
    temperatureMin: -10,
    temperatureMax: 40,
    tareMax: 15,
    tareType: 'SUBTRACTIVE' as const,
    hasLevelIndicator: true,
    isDirectSales: true,
    hasPriceComputing: false,
    isElectronic: true,
    serialNumber: `SN-${Date.now().toString().slice(-6)}`,
  });

  const filtered = instruments.filter(
    (i) =>
      i.patternDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Unauthorized: Only Admin role may register new instruments.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const ranges = [
        {
          rangeIndex: 1,
          min: Number(formData.min1),
          max: Number(formData.max1),
          e: Number(formData.e1),
          d: Number(formData.d1),
          n: Math.round(Number(formData.max1) / Number(formData.e1)),
        },
      ];

      if (formData.rangeType !== 'SINGLE_RANGE') {
        ranges.push({
          rangeIndex: 2,
          min: Number(formData.max1),
          max: Number(formData.max2),
          e: Number(formData.e2),
          d: Number(formData.d2),
          n: Math.round(Number(formData.max2) / Number(formData.e2)),
        });
      }

      await onRegisterInstrument({
        patternDesignation: formData.patternDesignation,
        applicationNumber: formData.applicationNumber,
        manufacturer: formData.manufacturer,
        applicant: formData.applicant || formData.manufacturer,
        instrumentCategory: formData.instrumentCategory,
        accuracyClass: formData.accuracyClass,
        rangeType: formData.rangeType,
        indicatingType: 'SELF_INDICATING',
        instrumentType: 'COMPLETE',
        units: formData.units,
        ranges,
        powerCategory: formData.powerCategory,
        nominalVoltage: Number(formData.nominalVoltage),
        temperatureMin: Number(formData.temperatureMin),
        temperatureMax: Number(formData.temperatureMax),
        initialZeroSettingRangePercent: 4.0,
        tareMax: Number(formData.tareMax),
        tareType: formData.tareType,
        hasLevelIndicator: formData.hasLevelIndicator,
        isDirectSales: formData.isDirectSales,
        hasPriceComputing: formData.hasPriceComputing,
        isElectronic: formData.isElectronic,
        hasSoftware: true,
        serialNumber: formData.serialNumber,
        identificationNumber: `EUT-${Math.floor(10 + Math.random() * 90)}`,
      });

      setShowRegisterForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register instrument');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Registered Non-Automatic Weighing Instruments (NAWIs)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Database of instruments submitted for OIML R 76 pattern evaluation.
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setShowRegisterForm(true)}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register New Instrument
          </button>
        ) : (
          <div className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            Registration: ADMIN ONLY
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by Pattern, Manufacturer, or Serial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
        />
      </div>

      {/* Grid of Instruments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((inst) => (
          <div
            key={inst.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-700 text-blue-300 font-mono text-xs font-bold">
                  Class {inst.accuracyClass}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{inst.rangeType}</span>
              </div>

              <h3 className="text-sm font-bold text-white mt-2">{inst.patternDesignation}</h3>
              <div className="text-xs text-slate-400">{inst.instrumentCategory}</div>
              <div className="text-xs text-slate-300 mt-1">Mfr: {inst.manufacturer}</div>

              {/* Technical Specifications */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Max: </span>
                  <span className="text-slate-200">
                    {inst.ranges.map((r) => r.max).join(' / ')} {inst.units}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Min: </span>
                  <span className="text-slate-200">
                    {inst.ranges[0].min} {inst.units}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">e: </span>
                  <span className="text-slate-200">
                    {inst.ranges.map((r) => r.e).join(' / ')} {inst.units}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">d: </span>
                  <span className="text-slate-200">
                    {inst.ranges.map((r) => r.d).join(' / ')} {inst.units}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Temp: </span>
                  <span className="text-slate-200">
                    {inst.temperatureMin} to {inst.temperatureMax} °C
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Power: </span>
                  <span className="text-slate-200">{inst.nominalVoltage} V</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 text-[10px]">SN: {inst.serialNumber}</span>
              {onSelectInstrument && (
                <button
                  type="button"
                  onClick={() => onSelectInstrument(inst)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Create Report &rarr;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Registration Modal Form (ADMIN ONLY) */}
      {showRegisterForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Register Non-Automatic Weighing Instrument</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded bg-rose-950/80 border border-rose-700 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Pattern Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.patternDesignation}
                    onChange={(e) => setFormData({ ...formData, patternDesignation: e.target.value })}
                    placeholder="e.g. LAB-PRECISE-300"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Mettler or Sartorius"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Accuracy Class *</label>
                  <select
                    value={formData.accuracyClass}
                    onChange={(e) => setFormData({ ...formData, accuracyClass: e.target.value as AccuracyClass })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  >
                    <option value="I">Class I (Special / Analytical)</option>
                    <option value="II">Class II (High / Precision)</option>
                    <option value="III">Class III (Medium / Commercial)</option>
                    <option value="IIII">Class IIII (Ordinary / Industrial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Range Configuration</label>
                  <select
                    value={formData.rangeType}
                    onChange={(e) => setFormData({ ...formData, rangeType: e.target.value as RangeType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  >
                    <option value="SINGLE_RANGE">Single Range</option>
                    <option value="MULTI_INTERVAL">Multi-Interval</option>
                    <option value="MULTIPLE_RANGE">Multiple Range</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Mass Units</label>
                  <select
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="mg">Milligrams (mg)</option>
                  </select>
                </div>
              </div>

              {/* Range 1 Specifications */}
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="font-mono font-semibold text-slate-300 text-[11px] mb-2">
                  RANGE 1 SPECIFICATIONS (e1, Max1)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px]">Max 1 ({formData.units})</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.max1}
                      onChange={(e) => setFormData({ ...formData, max1: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px]">Min 1 ({formData.units})</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.min1}
                      onChange={(e) => setFormData({ ...formData, min1: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px]">Interval e1 ({formData.units})</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.e1}
                      onChange={(e) => setFormData({ ...formData, e1: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-mono text-[10px]">Scale d1 ({formData.units})</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.d1}
                      onChange={(e) => setFormData({ ...formData, d1: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Range 2 Specifications if Multi-Interval */}
              {formData.rangeType !== 'SINGLE_RANGE' && (
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <div className="font-mono font-semibold text-slate-300 text-[11px] mb-2">
                    RANGE 2 SPECIFICATIONS (e2, Max2)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px]">Max 2 ({formData.units})</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.max2}
                        onChange={(e) => setFormData({ ...formData, max2: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px]">Interval e2 ({formData.units})</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.e2}
                        onChange={(e) => setFormData({ ...formData, e2: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-mono text-[10px]">Scale d2 ({formData.units})</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.d2}
                        onChange={(e) => setFormData({ ...formData, d2: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Temperature, Power & Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px]">Min Temp (°C)</label>
                  <input
                    type="number"
                    value={formData.temperatureMin}
                    onChange={(e) => setFormData({ ...formData, temperatureMin: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px]">Max Temp (°C)</label>
                  <input
                    type="number"
                    value={formData.temperatureMax}
                    onChange={(e) => setFormData({ ...formData, temperatureMax: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px]">Nominal Voltage (V)</label>
                  <input
                    type="number"
                    value={formData.nominalVoltage}
                    onChange={(e) => setFormData({ ...formData, nominalVoltage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px]">Tare Max ({formData.units})</label>
                  <input
                    type="number"
                    value={formData.tareMax}
                    onChange={(e) => setFormData({ ...formData, tareMax: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDirectSales}
                    onChange={(e) => setFormData({ ...formData, isDirectSales: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600"
                  />
                  <span>Direct Sales to Public</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasPriceComputing}
                    onChange={(e) => setFormData({ ...formData, hasPriceComputing: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600"
                  />
                  <span>Price Computing Feature</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasLevelIndicator}
                    onChange={(e) => setFormData({ ...formData, hasLevelIndicator: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600"
                  />
                  <span>Level Indicator Fitted</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Instrument'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
