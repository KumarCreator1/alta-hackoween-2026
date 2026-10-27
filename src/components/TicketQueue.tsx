'use client';

import type { IncidentTicket, ProposedMutation } from '@/db/schema';
import { useState } from 'react';

interface TicketQueueProps {
  tickets: IncidentTicket[];
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; text: string; glow: string }> = {
    CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]' },
    HIGH: { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]' },
    MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: '' },
    LOW: { bg: 'bg-gray-500/20', text: 'text-gray-400', glow: '' },
  };
  const c = config[severity] || config.MEDIUM;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full ${c.bg} ${c.text} ${c.glow}`}
    >
      {severity === 'CRITICAL' && '🔴 '}
      {severity === 'HIGH' && '🟠 '}
      {severity}
    </span>
  );
}

function MutationLine({ mutation }: { mutation: ProposedMutation }) {
  const icons: Record<string, { emoji: string; color: string; prefix: string }> = {
    PAUSE_TASK: { emoji: '🔴', color: 'text-red-400', prefix: '−' },
    REASSIGN_RESOURCE: { emoji: '🟡', color: 'text-amber-400', prefix: '~' },
    CREATE_TASK: { emoji: '🟢', color: 'text-emerald-400', prefix: '+' },
  };
  const config = icons[mutation.action] || icons.PAUSE_TASK;
  return (
    <div className="flex items-start gap-2 py-1 font-mono text-[11px]">
      <span className={`${config.color} font-bold w-3 shrink-0`}>{config.prefix}</span>
      <span className="text-gray-500">{config.emoji}</span>
      <div className="flex-1">
        <span className={config.color}>{mutation.action.replace('_', ' ')}</span>
        {mutation.targetId && (
          <span className="text-gray-500"> target=#{mutation.targetId}</span>
        )}
        {mutation.resourceId && (
          <span className="text-gray-500"> resource=#{mutation.resourceId}</span>
        )}
        {mutation.newTaskTitle && (
          <span className="text-cyan-400"> &quot;{mutation.newTaskTitle}&quot;</span>
        )}
        <div className="text-gray-600 text-[10px] mt-0.5 italic">{mutation.reason}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    AI_TRIAGE: 'bg-cyan-500/20 text-cyan-400',
    AWAITING_APPROVAL: 'bg-amber-500/20 text-amber-400',
    DISPATCHED: 'bg-emerald-500/20 text-emerald-400',
    RESOLVED: 'bg-gray-500/20 text-gray-400',
  };
  return (
    <span className={`text-[8px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded ${config[status] || ''}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function TicketQueue({ tickets, onApprove, onReject }: TicketQueueProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleApprove = async (id: number) => {
    setLoadingId(id);
    await onApprove(id);
    setLoadingId(null);
  };

  const handleReject = async (id: number) => {
    setLoadingId(id);
    await onReject(id);
    setLoadingId(null);
  };

  const pendingTickets = tickets.filter(
    (t) => t.status === 'AWAITING_APPROVAL' || t.status === 'AI_TRIAGE'
  );
  const dispatchedTickets = tickets.filter((t) => t.status === 'DISPATCHED');

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-500">
          🎯 Incident Diff Queue
        </span>
        <div className="flex-1 h-px bg-white/5" />
        {pendingTickets.length > 0 && (
          <span className="px-2 py-0.5 text-[9px] font-mono rounded-full bg-amber-500/20 text-amber-400">
            {pendingTickets.length} pending
          </span>
        )}
      </div>

      {/* Pending Tickets */}
      {pendingTickets.map((ticket) => {
        const mutations = (ticket.proposedMutations as ProposedMutation[]) || [];
        const isLoading = loadingId === ticket.id;

        return (
          <div
            key={ticket.id}
            className="glass-card p-4 space-y-3 slide-in border-l-2 border-l-amber-500/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={ticket.severity} />
                <StatusBadge status={ticket.status} />
              </div>
              <span className="text-[9px] font-mono text-gray-600">
                TKT-{String(ticket.id).padStart(3, '0')}
              </span>
            </div>

            <p className="text-[12px] text-gray-200 leading-relaxed">
              {ticket.executiveSummary}
            </p>

            <div className="flex items-center gap-1.5">
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono uppercase">
                {ticket.triggerType.replace(/_/g, ' ')}
              </span>
              <span className="text-[8px] text-gray-600 font-mono">
                FARM #{ticket.affectedFarmId}
              </span>
            </div>

            {/* Diff View */}
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="text-[9px] font-mono text-gray-500 mb-2 uppercase tracking-wider">
                Proposed Mutations ({mutations.length})
              </div>
              <div className="divide-y divide-white/5">
                {mutations.map((m, i) => (
                  <MutationLine key={i} mutation={m} />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {ticket.status === 'AWAITING_APPROVAL' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleApprove(ticket.id)}
                  disabled={isLoading}
                  className="flex-1 py-2 text-[11px] font-semibold tracking-wider uppercase rounded-lg
                             bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
                             hover:bg-emerald-500/30 hover:border-emerald-500/50 hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]
                             transition-all duration-200 disabled:opacity-40"
                >
                  {isLoading ? '⏳ Dispatching...' : '✓ Approve & Dispatch'}
                </button>
                <button
                  onClick={() => handleReject(ticket.id)}
                  disabled={isLoading}
                  className="px-4 py-2 text-[11px] font-semibold tracking-wider uppercase rounded-lg
                             text-red-400 border border-red-500/20
                             hover:bg-red-500/10 hover:border-red-500/40
                             transition-all duration-200 disabled:opacity-40"
                >
                  ✕ Override
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Dispatched Tickets */}
      {dispatchedTickets.map((ticket) => (
        <div
          key={ticket.id}
          className="glass-card p-3 border-l-2 border-l-emerald-500/50 opacity-60"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400">✅ Dispatched</span>
              <span className="text-[9px] font-mono text-gray-600">TKT-{String(ticket.id).padStart(3, '0')}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 truncate">{ticket.executiveSummary}</p>
        </div>
      ))}

      {/* Empty State */}
      {tickets.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-3 opacity-30">🛡️</div>
            <p className="text-[12px] text-gray-500">All clear — no incidents pending</p>
            <p className="text-[10px] text-gray-600 mt-1">System operating within nominal parameters</p>
          </div>
        </div>
      )}
    </div>
  );
}
