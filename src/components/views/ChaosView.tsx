'use client';

import React, { useState } from 'react';
import type { Farm, Resource, IncidentTicket } from '@/db/schema';
import LeafUploader from '@/components/LeafUploader';

interface ChaosViewProps {
  farms: Farm[];
  resources: Resource[];
  activeTickets: IncidentTicket[];
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
  onApproveTicket: (id: number) => Promise<void>;
  onRejectTicket: (id: number) => Promise<void>;
}

export default function ChaosView({
  farms,
  resources,
  activeTickets,
  onTriggerCrisis,
  onApproveTicket,
  onRejectTicket,
}: ChaosViewProps) {
  const [customType, setCustomType] = useState('WEATHER_WEBHOOK');
  const [customFarmId, setCustomFarmId] = useState(1);
  const [customDetails, setCustomDetails] = useState('');
  const [triggering, setTriggering] = useState(false);

  const handleCustomTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriggering(true);
    try {
      await onTriggerCrisis(customType, customFarmId, {
        condition: customDetails || 'Severe Anomaly Detected',
        disease: customDetails || 'Late Blight Outbreak',
        failureType: customDetails || 'Hydraulic Valve Seizure',
      });
      setCustomDetails('');
    } finally {
      setTriggering(false);
    }
  };

  const handleLeafUpload = async (base64: string) => {
    await onTriggerCrisis('CV_DISEASE_REPORT', 2, {
      disease: 'Late Blight Fungus',
      imageBase64: base64,
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Chaos Injector Laboratory</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Deterministic crisis triggers & multimodal computer vision triage workbench
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-xl border border-amber-300">
          ⚡ GOD MODE ENGAGED
        </span>
      </div>

      {/* 3 Core Hackathon Pitch Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trigger 1: Flash Storm */}
        <div className="donezo-card p-6 flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl mb-3">
              🌧️
            </div>
            <h3 className="text-sm font-bold text-gray-900">Compound Flash Storm</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Triggers a sudden <strong>Heavy Rain Warning</strong> on Sector Alpha. AI will automatically halt chemical spraying & fertilization tasks to prevent pesticide wash-off runoff.
            </p>
          </div>
          <button
            onClick={() => onTriggerCrisis('WEATHER_WEBHOOK', 1, { condition: 'HEAVY_RAIN_WARNING' })}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Simulate Storm (Alpha)</span>
          </button>
        </div>

        {/* Trigger 2: Fungal Blight CV */}
        <div className="donezo-card p-6 flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl mb-3">
              🍂
            </div>
            <h3 className="text-sm font-bold text-gray-900">Fungal Blight Outbreak</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Dispatches a <strong>Late Blight CV lesion report</strong> on Sector Beta. AI detects high-priority infection and commands cross-farm tractor borrowing from Sector Alpha.
            </p>
          </div>
          <button
            onClick={() => onTriggerCrisis('CV_DISEASE_REPORT', 2, { disease: 'Late Blight Fungus' })}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Simulate Blight (Beta)</span>
          </button>
        </div>

        {/* Trigger 3: Tractor Failure */}
        <div className="donezo-card p-6 flex flex-col justify-between space-y-4 hover:border-red-400 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center text-2xl mb-3">
              🔧
            </div>
            <h3 className="text-sm font-bold text-gray-900">Hydraulic Line Failure</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Simulates critical mechanical failure on <strong>Unit 01 Tractor</strong> during active tilling. AI marks asset down and dispatches backup machinery.
            </p>
          </div>
          <button
            onClick={() => onTriggerCrisis('EQUIPMENT_FAILURE', 1, { equipmentId: 1, failureType: 'HYDRAULIC_FAILURE' })}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Simulate Breakdown</span>
          </button>
        </div>
      </div>

      {/* Multimodal Leaf Upload & Custom Injection Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 donezo-card p-6 space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Multimodal Computer Vision Inspection</h3>
          <p className="text-xs text-gray-500">
            Upload actual crop pathology photos. Gemini 3.8 Flash inspects lesions and computes chemical containment dosages.
          </p>
          <LeafUploader onUpload={handleLeafUpload} />
        </div>

        <div className="lg:col-span-6 donezo-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Custom Scenario Injector</h3>
          <form onSubmit={handleCustomTrigger} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Trigger Event Type</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600"
                >
                  <option value="WEATHER_WEBHOOK">Weather Warning</option>
                  <option value="CV_DISEASE_REPORT">Crop Disease Vision</option>
                  <option value="EQUIPMENT_FAILURE">Equipment Breakdown</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Target Sector</label>
                <select
                  value={customFarmId}
                  onChange={(e) => setCustomFarmId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name.split(' - ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Anomaly Details</label>
              <input
                type="text"
                placeholder="e.g. Hailstorm alert or Sensor communication blackout"
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={triggering}
                className="btn-primary px-5 py-2 text-xs font-bold shadow-sm"
              >
                {triggering ? 'Invoking AI Engine...' : '⚡ Inject Anomaly into System'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
