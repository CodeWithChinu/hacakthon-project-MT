/**
 * Regulatory Rules View
 * Displays active and superseded regulatory standards (OIML R 76 editions)
 * ensuring reproducible pattern evaluation and historical report integrity.
 */

import React, { useState } from 'react';
import { RegulatoryRuleVersion, UserRole } from '../types/metrology';
import { BookOpen, CheckCircle2, History, Plus, Scale } from 'lucide-react';

interface Props {
  rules: RegulatoryRuleVersion[];
  role: UserRole;
  onAddRule?: (rule: Partial<RegulatoryRuleVersion>) => Promise<void>;
}

export const RegulatoryRulesView: React.FC<Props> = ({ rules, role }) => {
  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Legal Metrology Regulatory Rule Standards
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule versions ensure reproducible pattern evaluation across international revisions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((r) => (
          <div
            key={r.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-400 uppercase">
                {r.code}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  r.status === 'ACTIVE'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {r.status}
              </span>
            </div>

            <h3 className="text-base font-bold text-white">{r.name}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>

            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">MPE Engine:</span>
                <span className="text-slate-200">{r.mpeTableVersion}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Effective Date:</span>
                <span className="text-slate-200">{r.effectiveDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
