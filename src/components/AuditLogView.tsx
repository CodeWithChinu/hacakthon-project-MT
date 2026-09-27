/**
 * Master Audit Trail View
 * Displays append-only, immutable regulatory audit entries across all entities.
 */

import React, { useState } from 'react';
import { AuditLogEntry } from '../types/metrology';
import { ClipboardList, Search, Shield, Filter } from 'lucide-react';

interface Props {
  auditLogs: AuditLogEntry[];
}

export const AuditLogView: React.FC<Props> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = auditLogs.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      a.action.toLowerCase().includes(q) ||
      a.details.toLowerCase().includes(q) ||
      a.actorIdentifier.toLowerCase().includes(q) ||
      a.entityId.toLowerCase().includes(q);

    const matchRole = roleFilter === 'ALL' || a.actorRole === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            Append-Only Regulatory Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable tracking of pattern evaluation events, role access, calculations, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-mono"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="REVIEWER">REVIEWER</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/70 font-mono text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-44">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">{entry.timestamp}</td>
                  <td className="py-2.5 px-4 font-bold text-blue-400">{entry.action}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        entry.actorRole === 'ADMIN'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}
                    >
                      {entry.actorRole}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300 font-sans">{entry.actorIdentifier}</td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {entry.entityType} ({entry.entityId.slice(0, 10)})
                  </td>
                  <td className="py-2.5 px-4 text-slate-200 font-sans">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
