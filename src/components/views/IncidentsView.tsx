'use client';

import React, { useState } from 'react';
import type { IncidentTicket } from '@/db/schema';
import TicketQueue from '@/components/TicketQueue';

interface IncidentsViewProps {
  tickets: IncidentTicket[];
  onApproveTicket: (id: number) => Promise<void>;
  onRejectTicket: (id: number) => Promise<void>;
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
}

export default function IncidentsView({
  tickets,
  onApproveTicket,
  onRejectTicket,
  onTriggerCrisis,
}: IncidentsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredTickets = tickets.filter((t) => {
    if (filterSeverity === 'ALL') return true;
    return t.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">HITL Incident Diff Queue (The CRM Layer)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Human-in-the-Loop decision governance, autonomous mutation plans, and audit trail
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-xs text-xs font-bold">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterSeverity === sev
                    ? 'bg-[#134E35] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={() => onTriggerCrisis('WEATHER_WEBHOOK', 1, { condition: 'HEAVY_RAIN_WARNING' })}
            className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span>⚡</span>
            <span>Simulate Incident</span>
          </button>
        </div>
      </div>

      <div className="donezo-card p-6">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">
            Transaction Proposals Staged for Operator Signature ({filteredTickets.length})
          </span>
          <span className="text-xs text-gray-400">
            Drizzle ORM ACID Mutations Staged
          </span>
        </div>

        <TicketQueue
          tickets={filteredTickets}
          onApprove={onApproveTicket}
          onReject={onRejectTicket}
        />
      </div>
    </div>
  );
}

