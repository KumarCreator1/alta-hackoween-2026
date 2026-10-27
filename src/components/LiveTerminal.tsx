'use client';

import type { EventLog } from '@/db/schema';
import { useEffect, useRef, useState } from 'react';

interface LiveTerminalProps {
  logs: EventLog[];
  onNewLogs?: (logs: EventLog[]) => void;
}

export default function LiveTerminal({ logs: initialLogs, onNewLogs }: LiveTerminalProps) {
  const [logs, setLogs] = useState<EventLog[]>(initialLogs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onNewLogsRef = useRef(onNewLogs);

  // Keep ref up to date without triggering effects
  useEffect(() => {
    onNewLogsRef.current = onNewLogs;
  }, [onNewLogs]);

  // Sync when initialLogs from parent changes
  useEffect(() => {
    if (!initialLogs || initialLogs.length === 0) return;
    setLogs((prev) => {
      const map = new Map<number, EventLog>();
      prev.forEach((l) => map.set(l.id, l));
      initialLogs.forEach((l) => map.set(l.id, l));
      return Array.from(map.values()).sort((a, b) => a.id - b.id);
    });
  }, [initialLogs]);

  // SSE Connection for real-time logs
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/logs');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const incoming: EventLog[] = Array.isArray(data) ? data : [data];

            setLogs((prev) => {
              const map = new Map<number, EventLog>();
              prev.forEach((l) => map.set(l.id, l));
              let addedNew = false;

              incoming.forEach((l) => {
                if (!map.has(l.id)) {
                  map.set(l.id, l);
                  addedNew = true;
                }
              });

              if (!addedNew) return prev;
              const merged = Array.from(map.values()).sort((a, b) => a.id - b.id);
              onNewLogsRef.current?.(merged);
              return merged;
            });
          } catch {
            // ignore parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch {
        // SSE not supported
      }
    };

    connectSSE();

    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const levelBadges: Record<string, { bg: string; text: string }> = {
    INFO: { bg: 'bg-stone-800', text: 'text-stone-300' },
    WARN: { bg: 'bg-amber-900/60', text: 'text-amber-300' },
    CRITICAL: { bg: 'bg-red-900/60', text: 'text-red-300' },
    AI: { bg: 'bg-sky-900/60', text: 'text-sky-300' },
    DISPATCH: { bg: 'bg-emerald-900/60', text: 'text-emerald-300' },
  };

  const formatTime = (timestamp: string | Date) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return '--:--:--';
    }
  };

  const displayLogs = [...logs].sort((a, b) => a.id - b.id);

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-[11px] text-stone-400">
        <span>OPERATIONAL AUDIT STREAM</span>
        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
        </span>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="flex-1 bg-stone-950 p-3 rounded-lg overflow-y-auto text-[11px] leading-relaxed border border-stone-800 space-y-1"
      >
        {displayLogs.map((log, i) => {
          const badge = levelBadges[log.level] || levelBadges.INFO;
          return (
            <div
              key={`log-${log.id}-${i}`}
              className="flex items-start gap-2 py-0.5 text-stone-300"
            >
              <span className="text-stone-500 shrink-0 text-[10px]">
                {formatTime(log.timestamp)}
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${badge.bg} ${badge.text}`}>
                {log.level}
              </span>
              <span className="break-words flex-1 text-stone-300">
                {log.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
