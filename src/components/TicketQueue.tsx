'use client';

import React, { useState } from 'react';
import type { IncidentTicket, ProposedMutation } from '@/db/schema';

interface TicketQueueProps {
  tickets: IncidentTicket[];
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
}

export default function TicketQueue({
  tickets,
  onApprove,
  onReject,
}: TicketQueueProps) {
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
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-3">
          ✓
        </div>
        <h4 className="text-sm font-bold text-gray-800">All Operations Nominal</h4>
        <p className="text-xs text-gray-500 max-w-xs mt-1">
          No active crisis tickets pending approval. Trigger a simulated event from the Chaos Injector to test AI orchestration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
      {pendingTickets.map((ticket) => {
        const isCritical = ticket.severity === 'CRITICAL';
        const isDispatched = ticket.status === 'DISPATCHED';
        const mutations = (ticket.proposedMutations || []) as ProposedMutation[];

        return (
          <div
            key={ticket.id}
            className={`p-4 rounded-2xl border transition-all ${
              isDispatched
                ? 'bg-emerald-50/50 border-emerald-200'
                : isCritical
                ? 'bg-red-50/40 border-red-200'
                : 'bg-amber-50/40 border-amber-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    isCritical
                      ? 'bg-red-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {ticket.severity} INCIDENT #{ticket.id}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  Sector {ticket.affectedFarmId === 1 ? 'Alpha' : 'Beta'}
                </span>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDispatched
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {ticket.status.replace('_', ' ')}
              </span>
            </div>

            {/* AI Executive Summary */}
            <p className="text-xs font-medium text-gray-800 mb-3 leading-relaxed">
              {ticket.executiveSummary}
            </p>

            {/* Git-style Physical Mutation Diff */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-3 space-y-2 mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Proposed State Mutations (Diff)
              </span>

              {mutations.map((m, idx) => {
                const isPause = m.action === 'PAUSE_TASK';
                const isReassign = m.action === 'REASSIGN_RESOURCE';
                const isCreate = m.action === 'CREATE_TASK';

                return (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span
                      className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                        isPause
                          ? 'bg-red-100 text-red-700'
                          : isReassign
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isPause ? '− PAUSE' : isReassign ? '~ REROUTE' : '+ CREATE'}
                    </span>
                    <div className="flex-1 text-gray-700">
                      {isCreate && <span className="font-bold">{m.newTaskTitle}</span>}
                      {isReassign && (
                        <span>
                          Resource #{m.resourceId} routed to Farm #{m.toFarmId}
                        </span>
                      )}
                      {isPause && <span>Task #{m.targetId} paused immediately</span>}
                      <p className="text-[10px] text-gray-500 italic mt-0.5">
                        ↳ Reason: {m.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manager Action Buttons */}
            {!isDispatched && (
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => handleAction(ticket.id, 'reject')}
                  disabled={actingId === ticket.id}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-300 hover:bg-white text-gray-700 transition-all disabled:opacity-50"
                >
                  ✕ Override Plan
                </button>
                <button
                  onClick={() => handleAction(ticket.id, 'approve')}
                  disabled={actingId === ticket.id}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#134E35] hover:bg-[#0E3D29] text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actingId === ticket.id ? (
                    'Executing...'
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Approve & Dispatch</span>
                    </>
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
