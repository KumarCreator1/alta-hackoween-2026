'use client';

import React, { useState } from 'react';
import type { Farm, Resource, Task } from '@/db/schema';
import LeafUploader from '@/components/LeafUploader';
import { CloudRain, Bug, Wrench, Sparkles, CheckCircle2 } from 'lucide-react';

interface ChaosViewProps {
  farms: Farm[];
  resources: Resource[];
  tasks?: Task[];
  activeTickets?: any[];
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
  onApproveTicket?: (id: number) => Promise<void>;
  onRejectTicket?: (id: number) => Promise<void>;
  onRefresh?: () => void;
}

export default function ChaosView({
  farms,
  onTriggerCrisis,
  onRefresh,
}: ChaosViewProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<number>(farms[0]?.id || 1);
  const [triggering, setTriggering] = useState(false);
  const [customAnomaly, setCustomAnomaly] = useState('');
  const [anomalySeverity, setAnomalySeverity] = useState('HIGH');

  const farmAlpha = farms[0];
  const farmBeta = farms[1] || farms[0];
  const farmAlphaId = farmAlpha?.id || 1;
  const farmBetaId = farmBeta?.id || 2;
  const alphaLabel = farmAlpha ? (farmAlpha.code || farmAlpha.name.split(' - ')[0]) : 'Sector Alpha';
  const betaLabel = farmBeta ? (farmBeta.code || farmBeta.name.split(' - ')[0]) : 'Sector Beta';

  const handleLeafUpload = async (base64: string) => {
    await onTriggerCrisis('CV_DISEASE_REPORT', farmBetaId, {
      disease: 'Late Blight Fungus',
      imageBase64: base64,
    });
  };

  const handleCustomTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAnomaly.trim()) return;
    setTriggering(true);
    try {
      await onTriggerCrisis('CUSTOM_ANOMALY', selectedFarmId, {
        description: customAnomaly.trim(),
        severity: anomalySeverity,
      });
      setCustomAnomaly('');
    } finally {
      setTriggering(false);
      onRefresh?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Weather & Equipment Test Lab</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Test how weather changes, crop disease, and machinery repairs adjust farm schedules
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 bg-stone-100 text-stone-800 rounded border border-stone-300">
          Simulation Mode Active
        </span>
      </div>

      {/* 3 Core Incident Simulation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trigger 1: Heavy Rain Warning */}
        <div className="bg-white border border-stone-300 rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-stone-500 transition-colors shadow-2xs">
          <div>
            <div className="w-10 h-10 rounded bg-blue-50 text-blue-700 flex items-center justify-center mb-3 border border-blue-200">
              <CloudRain className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Severe Rain Front Ingestion</h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Triggers a sudden <strong>Heavy Rain Alert</strong> on {alphaLabel}. The constraint engine will automatically pause chemical spraying and fertilization tasks to prevent runoff.
            </p>
          </div>
          <button
            onClick={() => onTriggerCrisis('WEATHER_WEBHOOK', farmAlphaId, { condition: 'HEAVY_RAIN_WARNING' })}
            className="w-full py-2 rounded bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-colors"
          >
            Simulate Rain Alert ({alphaLabel})
          </button>
        </div>

        {/* Trigger 2: Fungal Blight CV */}
        <div className="bg-white border border-stone-300 rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-stone-500 transition-colors shadow-2xs">
          <div>
            <div className="w-10 h-10 rounded bg-amber-50 text-amber-700 flex items-center justify-center mb-3 border border-amber-200">
              <Bug className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Late Blight Outbreak</h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Dispatches a <strong>Foliage Pathology report</strong> on {betaLabel}. Triage detects urgent infection and commands cross-farm sprayer borrowing from {alphaLabel}.
            </p>
          </div>
          <button
            onClick={() => onTriggerCrisis('CV_DISEASE_REPORT', farmBetaId, { disease: 'Late Blight Fungus' })}
            className="w-full py-2 rounded bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-colors"
          >
            Simulate Blight ({betaLabel})
          </button>
        </div>

        {/* Trigger 3: Tractor Failure */}
        <div className="bg-white border border-stone-300 rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-stone-500 transition-colors shadow-2xs">
          <div>
            <div className="w-10 h-10 rounded bg-red-50 text-red-700 flex items-center justify-center mb-3 border border-red-200">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">Implement Hydraulic Fault</h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Simulates equipment breakdown on <strong>Machinery</strong> at {alphaLabel}. Flags asset for repair and routes standby machinery.
            </p>
          </div>
          <button
            onClick={() => onTriggerCrisis('EQUIPMENT_FAILURE', farmAlphaId, { failureType: 'HYDRAULIC_FAILURE' })}
            className="w-full py-2 rounded bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-colors"
          >
            Simulate Breakdown ({alphaLabel})
          </button>
        </div>
      </div>

      {/* Multimodal Leaf Image Upload & Custom Anomaly Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leaf Uploader */}
        <div className="bg-white border border-stone-300 rounded-lg p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Foliage Pathology Assay (Vision Triage)
            </h4>
            <span className="text-[10px] font-mono text-stone-500">Gemini Vision</span>
          </div>
          <p className="text-xs text-stone-500">
            Upload leaf imagery to test lesion detection. Gemini identifies pathogen taxonomy and drafts intervention orders.
          </p>
          <LeafUploader onUpload={handleLeafUpload} />
        </div>

        {/* Custom Event Injection */}
        <div className="bg-white border border-stone-300 rounded-lg p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Custom Agronomic Disturbance
            </h4>
            <span className="text-[10px] font-mono text-stone-500">Ad-Hoc Ingestion</span>
          </div>

          <form onSubmit={handleCustomTrigger} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Target Sector:</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                  className="w-full p-2 rounded border border-stone-300 bg-stone-50 font-mono"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} - {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Severity Rating:</label>
                <select
                  value={anomalySeverity}
                  onChange={(e) => setAnomalySeverity(e.target.value)}
                  className="w-full p-2 rounded border border-stone-300 bg-stone-50 font-mono"
                >
                  <option value="CRITICAL">Critical (Immediate Stop)</option>
                  <option value="HIGH">High (Priority Surge)</option>
                  <option value="MEDIUM">Medium (Advisory)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Incident Parameters:</label>
              <textarea
                rows={2}
                placeholder="e.g. Center pivot irrigation pressure drop at Pivot 03; soil tension sensor reading zero flow."
                value={customAnomaly}
                onChange={(e) => setCustomAnomaly(e.target.value)}
                className="w-full p-2 rounded border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={triggering || !customAnomaly.trim()}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-xs rounded shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{triggering ? 'Evaluating Triage...' : 'Inject Disturbance into System'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
