'use client';

import React, { useState } from 'react';
import type { Ticket, ProposedMutation } from '@/db/schema';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TicketQueueProps {
  tickets: Ticket[];
  onApprove: (ticketId: number) => Promise<void>;
  onReject: (ticketId: number) => Promise<void>;
}

export default function TicketQueue({ tickets, onApprove, onReject }: TicketQueueProps) {
  const [actingId, setActingId] = useState<number | null>(null);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setActingId(id);
    try {
      if (action === 'approve') await onApprove(id);
      else await onReject(id);
    } finally {
      setActingId(null);
    }
  };

  const pendingTickets = tickets.filter((t) => t.status !== 'RESOLVED');

  if (pendingTickets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center border border-dashed border-stone-200 rounded-lg">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
        <h4 className="text-xs font-bold text-stone-800">Operational Continuity Maintained</h4>
        <p className="text-[11px] text-stone-500 max-w-xs mt-1">
          Zero active incident tickets pending operator sign-off. Telemetry monitoring nominal across all sectors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingTickets.map((ticket) => {
        const mutations = (ticket.proposedMutations as ProposedMutation[]) || [];
        const isDispatched = ticket.status === 'RESOLVED';

        return (
          <div
            key={ticket.id}
            className="p-4 rounded-lg border border-stone-300 bg-white space-y-3 shadow-2xs"
          >
            {/* Ticket Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      ticket.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : ticket.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-stone-100 text-stone-700 border border-stone-300'
                    }`}
                  >
                    {ticket.severity} SEVERITY
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    TICKET #{ticket.id} • SECTOR {ticket.affectedFarmId}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-stone-900 mt-1">{ticket.executiveSummary}</h4>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  Trigger Event: {ticket.triggerType}
                </p>
              </div>

              {isDispatched && (
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-mono">
                  EXECUTED
                </span>
              )}
            </div>

            {/* Proposed Mutations Diff Table */}
            <div className="space-y-1.5 bg-stone-50 p-2.5 rounded border border-stone-200">
              <span className="text-[10px] font-mono font-bold text-stone-500 block uppercase tracking-wider">
                Proposed State Changes ({mutations.length}):
              </span>
              {mutations.map((mut, idx) => {
                const isPause = mut.action === 'PAUSE_TASK';
                const isReassign = mut.action === 'REASSIGN_RESOURCE';
                const isCreate = mut.action === 'CREATE_TASK';

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs py-1 px-2 rounded bg-white border border-stone-200 font-mono"
                  >
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isPause
                          ? 'bg-red-100 text-red-800'
                          : isReassign
                          ? 'bg-amber-100 text-amber-800'
                          : isCreate
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {mut.action}
                    </span>
                    <div className="text-[11px] text-stone-700 min-w-0 flex-1">
                      <div>
                        {mut.newTaskTitle || (mut.targetId ? `Target ID #${mut.targetId}` : 'Operational adjustment')}
                      </div>
                      <p className="text-[10px] text-stone-500 italic mt-0.5">
                        {mut.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manager Action Controls */}
            {!isDispatched && (
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  onClick={() => handleAction(ticket.id, 'reject')}
                  disabled={actingId === ticket.id}
                  className="px-3 py-1.5 text-xs font-semibold rounded border border-stone-300 hover:bg-stone-50 text-stone-700 transition-colors disabled:opacity-50"
                >
                  Dismiss Plan
                </button>
                <button
                  onClick={() => handleAction(ticket.id, 'approve')}
                  disabled={actingId === ticket.id}
                  className="px-4 py-1.5 text-xs font-bold rounded bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actingId === ticket.id ? (
                    'Executing...'
                  ) : (
                    <span>Approve & Execute Mutations</span>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
