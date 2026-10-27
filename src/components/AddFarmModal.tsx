'use client';

import React, { useState } from 'react';
import { X, MapPin, Sprout, Droplets, Layers, Gauge } from 'lucide-react';

interface AddFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddFarmModal({ isOpen, onClose, onCreated }: AddFarmModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region: 'Central Valley, CA',
    acreage: 450,
    cropType: 'Winter Wheat & Soybeans',
    soilType: 'Silt Loam',
    soilPh: '6.8',
    targetMoistureMin: 40,
    targetMoistureMax: 65,
    irrigationType: 'DRIP_MICRO',
    weatherStatus: 'Clear Skies, 24°C',
    tempCelsius: 24,
    windSpeedKmh: 12,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          acreage: Number(formData.acreage),
          targetMoistureMin: Number(formData.targetMoistureMin),
          targetMoistureMax: Number(formData.targetMoistureMax),
          tempCelsius: Number(formData.tempCelsius),
          windSpeedKmh: Number(formData.windSpeedKmh),
        }),
      });

      if (!res.ok) throw new Error('Failed to create farm');
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error creating new farm sector. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Register New Farm Sector</h2>
              <p className="text-[11px] text-stone-500">Centralize land telemetry, crop type & irrigation requirements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Sector Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sector Epsilon - Highland Basin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Code</label>
              <input
                type="text"
                placeholder="SEC-05"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" /> Geographic Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g. Salinas Valley, CA"
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-stone-400" /> Total Acreage (Acres)
              </label>
              <input
                type="number"
                min="1"
                value={formData.acreage}
                onChange={(e) => setFormData({ ...formData, acreage: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Sprout className="w-3 h-3 text-stone-400" /> Primary Crop Variety
              </label>
              <input
                type="text"
                value={formData.cropType}
                onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                placeholder="e.g. Organic Strawberries & Kale"
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-stone-400" /> Irrigation Infrastructure
              </label>
              <select
                value={formData.irrigationType}
                onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600 bg-white"
              >
                <option value="DRIP_MICRO">Drip Micro-Emitter Array</option>
                <option value="CENTER_PIVOT">Center Pivot Telemetric Rig</option>
                <option value="FLOOD_GATE">Automated Flood Gate System</option>
                <option value="DRONE_AERIAL">Autonomous Aerial Drone Sprayer</option>
              </select>
            </div>
          </div>

          {/* Soil & Environmental Parameters */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-3">
            <div className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-700" /> Agronomic Soil & Moisture Envelope
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-stone-500 mb-0.5">Soil Type</label>
                <input
                  type="text"
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-500 mb-0.5">Soil pH</label>
                <input
                  type="text"
                  value={formData.soilPh}
                  onChange={(e) => setFormData({ ...formData, soilPh: e.target.value })}
                  placeholder="6.5"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-500 mb-0.5">Min Moisture %</label>
                <input
                  type="number"
                  value={formData.targetMoistureMin}
                  onChange={(e) => setFormData({ ...formData, targetMoistureMin: Number(e.target.value) })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-500 mb-0.5">Max Moisture %</label>
                <input
                  type="number"
                  value={formData.targetMoistureMax}
                  onChange={(e) => setFormData({ ...formData, targetMoistureMax: Number(e.target.value) })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#134E35] hover:bg-[#0F3E2A] rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Establish Sector'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

