'use client';

import React from 'react';
import type { Task, Farm } from '@/db/schema';
import LeafUploader from './LeafUploader';
import { CloudRain, Bug, Wrench } from 'lucide-react';

interface CrisisCardProps {
  farms: Farm[];
  tasks: Task[];
  onTriggerCrisis: (type: string, farmId: number, payload?: Record<string, unknown>) => Promise<void>;
  onRefresh: () => void;
}

export default function CrisisCard({
  farms,
  tasks,
  onTriggerCrisis,
  onRefresh,
}: CrisisCardProps) {
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
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* 1. Incident Simulator Dock */}
      <div className="bg-stone-900 text-white rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-200">
            Environmental Incident Simulator
          </span>
          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-stone-300">
            Simulation Ready
          </span>
        </div>

        <p className="text-xs text-stone-400 leading-relaxed">
          Inject compound environmental alerts to trigger autonomous multi-farm reallocation.
        </p>

        {/* 3 Trigger Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() =>
              onTriggerCrisis('WEATHER_WEBHOOK', farmAlphaId, {
                condition: 'HEAVY_RAIN_WARNING',
              })
            }
            className="p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition-colors flex flex-col justify-between"
          >
            <CloudRain className="w-4 h-4 text-sky-400 mb-1" />
            <div className="text-[11px] font-bold leading-tight text-white">Rain Alert</div>
            <div className="text-[9px] text-stone-400 font-mono mt-0.5 truncate">{alphaLabel}</div>
          </button>

          <button
            onClick={() =>
              onTriggerCrisis('CV_DISEASE_REPORT', farmBetaId, {
                disease: 'Late Blight Fungus',
              })
            }
            className="p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition-colors flex flex-col justify-between"
          >
            <Bug className="w-4 h-4 text-amber-400 mb-1" />
            <div className="text-[11px] font-bold leading-tight text-white">Blight Spore</div>
            <div className="text-[9px] text-stone-400 font-mono mt-0.5 truncate">{betaLabel}</div>
          </button>

          <button
            onClick={() =>
              onTriggerCrisis('EQUIPMENT_FAILURE', farmAlphaId, {
                failureType: 'HYDRAULIC_FAILURE',
              })
            }
            className="p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left transition-colors flex flex-col justify-between"
          >
            <Wrench className="w-4 h-4 text-red-400 mb-1" />
            <div className="text-[11px] font-bold leading-tight text-white">Tractor Fault</div>
            <div className="text-[9px] text-stone-400 font-mono mt-0.5 truncate">{alphaLabel} Valve</div>
          </button>
        </div>
      </div>

      {/* 2. Foliage Disease Multimodal Uploader */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
          Computer Vision Pathology Assay
        </span>
        <LeafUploader onUpload={handleLeafUpload} />
      </div>
    </div>
  );
}
