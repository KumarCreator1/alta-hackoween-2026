'use client';

import React, { useState, useMemo } from 'react';
import type { Farm, Task } from '@/db/schema';
import {
  evaluateSectorConstraints,
  type SectorConstraintReport,
} from '@/lib/weatherConstraints';
import {
  CloudRain,
  Wind,
  Droplets,
  Plane,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PlayCircle,
} from 'lucide-react';

interface WeatherConstraintMatrixProps {
  farms: Farm[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function WeatherConstraintMatrix({
  farms,
  tasks,
  onRefresh,
}: WeatherConstraintMatrixProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [lastAuditSummary, setLastAuditSummary] = useState<string | null>(null);

  // Compute reports for all sectors
  const sectorReports: SectorConstraintReport[] = useMemo(() => {
    return farms.map((farm) => {
      const farmTasks = tasks.filter((t) => t.farmId === farm.id);
      return evaluateSectorConstraints(farm, farmTasks);
    });
  }, [farms, tasks]);

  // Aggregate stats
  const totalLockedOutSectors = sectorReports.filter((r) => r.overallStatus === 'LOCKED_OUT').length;
  const totalWarningSectors = sectorReports.filter((r) => r.overallStatus === 'WARNING').length;
  const totalConflictedTasks = sectorReports.reduce((acc, r) => acc + r.affectedTasks.length, 0);

  const handleRunAudit = async (autoResume = false) => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/constraints/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoResume }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastAuditSummary(
          `Evaluated ${farms.length} sectors: ${data.pausedCount} task(s) auto-paused, ${data.resumedCount} task(s) cleared.`
        );
        onRefresh();
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="bg-white border border-stone-300 rounded-lg shadow-2xs overflow-hidden space-y-3 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight">
              Phase 1: Weather-Task Constraint Matrix
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold border border-stone-200">
              Agronomic Rules Engine
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Automated conflict gate matching live weather, wind drift, and soil saturation against field operations
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunAudit(false)}
            disabled={evaluating}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Evaluating...' : 'Run Constraint Audit'}</span>
          </button>

          <button
            onClick={() => handleRunAudit(true)}
            disabled={evaluating}
            className="px-3 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-800 rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            title="Automatically clear and resume tasks whose weather constraints have resolved"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>Clear & Resume Safe Tasks</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded border border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-stone-500">Sectors Monitored</div>
            <div className="text-base font-bold text-stone-900">{farms.length} Sectors</div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-stone-400" />
        </div>

        <div className="p-2.5 rounded border border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-stone-500">Lockout Risk Hubs</div>
            <div className="text-base font-bold text-red-700">{totalLockedOutSectors} Sectors</div>
          </div>
          <ShieldAlert className="w-4 h-4 text-red-600" />
        </div>

        <div className="p-2.5 rounded border border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-stone-500">Wind / Moisture Alerts</div>
            <div className="text-base font-bold text-amber-700">{totalWarningSectors} Sectors</div>
          </div>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>

        <div className="p-2.5 rounded border border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-stone-500">Conflicted Work Orders</div>
            <div className="text-base font-bold text-stone-900">{totalConflictedTasks} Active</div>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">
            AUTO-GATE
          </span>
        </div>
      </div>

      {lastAuditSummary && (
        <div className="p-2 bg-stone-100 rounded text-xs text-stone-800 font-mono border border-stone-300 flex items-center justify-between">
          <span>{lastAuditSummary}</span>
          <button
            onClick={() => setLastAuditSummary(null)}
            className="text-stone-400 hover:text-stone-700 text-xs font-bold"
          >
            x
          </button>
        </div>
      )}

      {/* Main Constraint Table */}
      <div className="overflow-x-auto border border-stone-200 rounded">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-300 font-mono text-[11px]">
              <th className="py-2 px-3 border-r border-stone-200">Sector & Weather</th>
              <th className="py-2 px-3 border-r border-stone-200">
                <div className="flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-sky-600" />
                  <span>Chemical Wash-Off (4h)</span>
                </div>
              </th>
              <th className="py-2 px-3 border-r border-stone-200">
                <div className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-amber-600" />
                  <span>Spray Drift (&lt;15 km/h)</span>
                </div>
              </th>
              <th className="py-2 px-3 border-r border-stone-200">
                <div className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-emerald-600" />
                  <span>Soil Compaction (&lt;Max)</span>
                </div>
              </th>
              <th className="py-2 px-3 border-r border-stone-200">
                <div className="flex items-center gap-1">
                  <Plane className="w-3 h-3 text-stone-600" />
                  <span>Drone Envelope (&lt;22 km/h)</span>
                </div>
              </th>
              <th className="py-2 px-3">Conflicted Tasks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {sectorReports.map((report) => {
              const washOff = report.constraints.find((c) => c.type === 'WASH_OFF');
              const windDrift = report.constraints.find((c) => c.type === 'WIND_DRIFT');
              const soilComp = report.constraints.find((c) => c.type === 'SOIL_COMPACTION');
              const droneEnv = report.constraints.find((c) => c.type === 'DRONE_ENVELOPE');

              return (
                <tr key={report.farmId} className="hover:bg-stone-50/80 transition-colors">
                  {/* Sector Name & Live Weather */}
                  <td className="py-2.5 px-3 border-r border-stone-200">
                    <div className="font-bold text-stone-900 font-mono">{report.farmCode}</div>
                    <div className="text-[11px] text-stone-600 truncate max-w-[160px]">
                      {report.farmName.split(' - ')[1] || report.farmName}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                      {report.weatherStatus}
                    </div>
                  </td>

                  {/* 1. Chemical Wash-off */}
                  <td className="py-2.5 px-3 border-r border-stone-200">
                    {washOff?.severity === 'LOCKED_OUT' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-100 text-red-800 border border-red-300">
                        LOCKED OUT (Rain Alert)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Safe (0% Rain in 4h)
                      </span>
                    )}
                  </td>

                  {/* 2. Spray Drift */}
                  <td className="py-2.5 px-3 border-r border-stone-200">
                    {windDrift?.severity === 'LOCKED_OUT' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-100 text-red-800 border border-red-300">
                        LOCKED OUT ({report.windSpeedKmh} km/h)
                      </span>
                    ) : windDrift?.severity === 'WARNING' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
                        High Drift ({report.windSpeedKmh} km/h)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Nominal ({report.windSpeedKmh} km/h)
                      </span>
                    )}
                  </td>

                  {/* 3. Soil Compaction */}
                  <td className="py-2.5 px-3 border-r border-stone-200">
                    {soilComp?.severity === 'LOCKED_OUT' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-100 text-red-800 border border-red-300">
                        Saturated ({report.soilMoisture}%)
                      </span>
                    ) : soilComp?.severity === 'WARNING' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
                        Elevated ({report.soilMoisture}%)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Optimal ({report.soilMoisture}%)
                      </span>
                    )}
                  </td>

                  {/* 4. Drone Envelope */}
                  <td className="py-2.5 px-3 border-r border-stone-200">
                    {droneEnv?.severity === 'LOCKED_OUT' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-100 text-red-800 border border-red-300">
                        Restricted
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Flight Clear
                      </span>
                    )}
                  </td>

                  {/* Conflicted Tasks */}
                  <td className="py-2.5 px-3">
                    {report.affectedTasks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {report.affectedTasks.map((t) => (
                          <span
                            key={t.id}
                            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                              t.status === 'PAUSED_BY_AI'
                                ? 'bg-red-50 text-red-800 border-red-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                            title={t.title}
                          >
                            #{t.id} {t.category} ({t.status === 'PAUSED_BY_AI' ? 'PAUSED' : 'AT RISK'})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-stone-400">
                        Zero conflicts
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
