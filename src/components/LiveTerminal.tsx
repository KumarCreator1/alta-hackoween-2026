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

  // Sync when initialLogs from parent changes (merge uniquely by ID)
  useEffect(() => {
    if (!initialLogs || initialLogs.length === 0) return;
    setLogs((prev) => {
      const map = new Map<number, EventLog>();
      // Keep previous
      prev.forEach((l) => map.set(l.id, l));
      // Overwrite/add incoming
      initialLogs.forEach((l) => map.set(l.id, l));
      return Array.from(map.values()).sort((a, b) => a.id - b.id);
    });
  }, [initialLogs]);

  // SSE Connection for real-time logs (runs ONCE on mount)
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
          // Backoff before reconnecting to avoid spamming
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
  }, []); // Run ONCE on mount

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const levelColors: Record<string, string> = {
    INFO: 'text-gray-400',
    WARN: 'text-amber-400',
    CRITICAL: 'text-red-400',
    AI: 'text-cyan-400',
    DISPATCH: 'text-emerald-400',
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

  // Sort chronologically by ID ascending
  const displayLogs = [...logs].sort((a, b) => a.id - b.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-500 font-mono">
          &gt;_ Live System Log
        </span>
        <div className="flex-1 h-px bg-white/5" />
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-live" />
          <span className="text-[8px] font-mono text-gray-500">STREAM ACTIVE</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="flex-1 glass-card p-3 overflow-y-auto relative scanlines font-mono text-[11px] leading-relaxed"
      >
        {displayLogs.map((log, i) => (
          <div
            key={`log-${log.id}-${i}`}
            className={`flex gap-2 py-0.5 ${i === displayLogs.length - 1 ? 'slide-in' : ''}`}
          >
            <span className="text-gray-600 shrink-0 text-[10px]">
              [{formatTime(log.timestamp)}]
            </span>
            <span className="shrink-0">{log.emoji}</span>
            <span className={`${levelColors[log.level] || 'text-gray-400'} break-words`}>
              {log.message}
            </span>
          </div>
        ))}
        {/* Cursor */}
        <div className="flex items-center gap-1 mt-1 text-gray-600">
          <span className="text-[10px]">$</span>
          <span className="w-2 h-3.5 bg-gray-500/50 pulse-live" />
        </div>
      </div>
    </div>
  );
}
