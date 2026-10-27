'use client';

import React, { useState } from 'react';
import type { Ticket, Farm, Resource } from '@/db/schema';
import TicketQueue from '@/components/TicketQueue';
import { AlertCircle } from 'lucide-react';

interface IncidentsViewProps {
  tickets: Ticket[];
  farms: Farm[];
  resources: Resource[];
  onApproveTicket: (id: number) => Promise<void>;
  onRejectTicket: (id: number) => Promise<void>;
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
}

export default function IncidentsView({
  tickets,
  farms,
  onApproveTicket,
  onRejectTicket,
  onTriggerCrisis,
}: IncidentsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredTickets = tickets.filter((t) => {
    if (filterSeverity !== 'ALL' && t.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Human-in-the-Loop Incident Queue
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Operational disturbance proposals and mutation diffs awaiting operator sign-off
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-stone-300 text-xs font-semibold">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterSeverity === sev
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={() => onTriggerCrisis('WEATHER_WEBHOOK', farms[0]?.id || 1, { condition: 'HEAVY_RAIN_WARNING' })}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Simulate Incident</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-300 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
          <span className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">
            Transaction Proposals Staged for Operator Signature ({filteredTickets.length})
          </span>
          <span className="text-xs text-stone-500 font-mono">
            ACID State Mutex Staged
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
