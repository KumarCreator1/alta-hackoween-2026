'use client';

import React from 'react';
import type { Task, Farm } from '@/db/schema';
import LeafUploader from './LeafUploader';

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
  const farmAlphaId = farms[0]?.id || 1;
  const farmBetaId = farms[1]?.id || 2;

  const handleLeafUpload = async (base64: string) => {
    await onTriggerCrisis('CV_DISEASE_REPORT', farmBetaId, {
      disease: 'Late Blight Fungus',
      imageBase64: base64,
    });
    onRefresh();
  };

  const priorityTasks = tasks.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 1. Interactive Chaos Injector Dock */}
      <div className="bg-gradient-to-br from-[#134E35] to-[#0D3826] text-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Chaos Injector Dock
            </span>
          </div>
          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-emerald-100">
            GOD MODE ACTIVE
          </span>
        </div>

        <p className="text-xs text-emerald-100/90 leading-relaxed mb-3">
          Simulate compound environmental clashing to trigger autonomous cross-farm reallocation.
        </p>

        {/* 3 Pitch-Winning Chaos Trigger Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() =>
              onTriggerCrisis('WEATHER_WEBHOOK', farmAlphaId, {
                condition: 'HEAVY_RAIN_WARNING',
              })
            }
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all hover:scale-[1.02]"
          >
            <div className="text-base mb-1">🌧️</div>
            <div className="text-[11px] font-bold leading-tight">Flash Storm</div>
            <div className="text-[9px] text-emerald-200/70 mt-0.5">Sector Alpha</div>
          </button>

          <button
            onClick={() =>
              onTriggerCrisis('CV_DISEASE_REPORT', farmBetaId, {
                disease: 'Late Blight Fungus',
              })
            }
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all hover:scale-[1.02]"
          >
            <div className="text-base mb-1">🍂</div>
            <div className="text-[11px] font-bold leading-tight">Fungal Blight</div>
            <div className="text-[9px] text-emerald-200/70 mt-0.5">Sector Beta</div>
          </button>

          <button
            onClick={() =>
              onTriggerCrisis('EQUIPMENT_FAILURE', farmAlphaId, {
                equipmentId: 1,
                failureType: 'HYDRAULIC_FAILURE',
              })
            }
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all hover:scale-[1.02]"
          >
            <div className="text-base mb-1">🔧</div>
            <div className="text-[11px] font-bold leading-tight">Tractor Fail</div>
            <div className="text-[9px] text-emerald-200/70 mt-0.5">Unit 01 Hydraulic</div>
          </button>
        </div>
      </div>

      {/* 2. Drag & Drop Leaf Disease Multimodal Uploader */}
      <div>
        <LeafUploader onUpload={handleLeafUpload} />
      </div>

      {/* 3. Priority Task Schedule Preview */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-1">
          Active Field Operations
        </span>

        {priorityTasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all text-xs"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="w-2 h-2 rounded-full bg-[#134E35]" />
              <div className="truncate">
                <span className="font-semibold text-gray-800 truncate block">
                  {t.title}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {t.scheduledSlot} • Sector {t.farmId === 1 ? 'Alpha' : 'Beta'}
                </span>
              </div>
            </div>
            <span
              className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-md ${
                t.status === 'PAUSED_BY_AI'
                  ? 'bg-red-100 text-red-700'
                  : t.status === 'IN_PROGRESS'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
