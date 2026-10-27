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

  // Update logs when prop changes
  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  // SSE Connection for real-time logs
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/logs');

      eventSource.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data) as EventLog;
          setLogs((prev) => {
            const updated = [...prev, newLog];
            onNewLogs?.(updated);
            return updated;
          });
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 3s
        setTimeout(() => {
          // Will reconnect on next render cycle
        }, 3000);
      };
    } catch {
      // SSE not available
    }

    return () => {
      eventSource?.close();
    };
  }, [onNewLogs]);

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
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Show logs in chronological order (reversed from desc query)
  const chronologicalLogs = [...logs].reverse();

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
        {chronologicalLogs.map((log, i) => (
          <div
            key={log.id || i}
            className={`flex gap-2 py-0.5 ${i === chronologicalLogs.length - 1 ? 'slide-in' : ''}`}
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
