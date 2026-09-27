/**
 * Modal to create a new OIML Pattern Evaluation Report
 * Available to ADMIN role.
 */

import React, { useState } from 'react';
import { Instrument, RegulatoryRuleVersion } from '../types/metrology';
import { FilePlus, X, Scale } from 'lucide-react';

interface Props {
  instruments: Instrument[];
  rules: RegulatoryRuleVersion[];
  onClose: () => void;
  onCreate: (data: { instrumentId: string; ruleVersionId: string; observerName: string }) => Promise<void>;
}

export const NewReportModal: React.FC<Props> = ({
  instruments,
  rules,
  onClose,
  onCreate,
}) => {
  const [selectedInstId, setSelectedInstId] = useState(instruments[0]?.id || '');
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id || '');
  const [observerName, setObserverName] = useState('Laboratory Testing Officer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) {
      setErrorMsg('Please select a registered weighing instrument.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await onCreate({
        instrumentId: selectedInstId,
        ruleVersionId: selectedRuleId,
        observerName,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create evaluation report.');
    } finally {
      setLoading(false);
    }
  };

  const selectedInst = instruments.find((i) => i.id === selectedInstId);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Create New Pattern Evaluation Dossier</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded bg-rose-950/80 border border-rose-700 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-mono mb-1">Select Instrument *</label>
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
            >
              {instruments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.patternDesignation} (Class {inst.accuracyClass}, Max {inst.ranges.map((r) => r.max).join('/')} {inst.units}) — {inst.manufacturer}
                </option>
              ))}
            </select>
          </div>

          {selectedInst && (
            <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-blue-400 font-semibold">{selectedInst.instrumentCategory}</div>
              <div className="text-slate-300">Category: {selectedInst.rangeType}</div>
              <div className="text-slate-300">Verification Interval e: {selectedInst.ranges.map((r) => r.e).join('/')} {selectedInst.units}</div>
              <div className="text-slate-300">Scale Interval d: {selectedInst.ranges.map((r) => r.d).join('/')} {selectedInst.units}</div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-mono mb-1">Regulatory Evaluation Standard *</label>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
            >
              {rules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name} [{rule.code}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono mb-1">Evaluating Testing Officer *</label>
            <input
              type="text"
              required
              value={observerName}
              onChange={(e) => setObserverName(e.target.value)}
              placeholder="e.g. Officer Name, Metrology Specialist"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Dossier...' : 'Create Evaluation Dossier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
