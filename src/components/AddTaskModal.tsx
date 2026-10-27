'use client';

import React, { useState } from 'react';
import type { Farm, Resource } from '@/db/schema';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  farms: Farm[];
  resources: Resource[];
  onAddTask: (data: {
    title: string;
    farmId: number;
    assignedResourceId?: number | null;
    priority: number;
    scheduledSlot: string;
    category: string;
  }) => Promise<void>;
}

export default function AddTaskModal({
  isOpen,
  onClose,
  farms,
  resources,
  onAddTask,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [farmId, setFarmId] = useState(farms[0]?.id || 1);
  const [assignedResourceId, setAssignedResourceId] = useState<number | null>(null);
  const [priority, setPriority] = useState(2);
  const [scheduledSlot, setScheduledSlot] = useState('14:00 - 16:00');
  const [category, setCategory] = useState('SPRAYING');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);
    try {
      await onAddTask({
        title,
        farmId,
        assignedResourceId,
        priority,
        scheduledSlot,
        category,
      });
      onClose();
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 slide-up space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Dispatch New Field Task</h3>
            <p className="text-xs text-gray-500">Assign automated or human mission to sector schedule</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Task Title</label>
            <input
              type="text"
              placeholder="e.g. Emergency Foliar Spraying - West Quadrant"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Target Sector</label>
              <select
                value={farmId}
                onChange={(e) => setFarmId(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="SPRAYING">Chemical Spraying</option>
                <option value="TILLAGE">Tillage & Preparation</option>
                <option value="HARVEST">Harvesting</option>
                <option value="SURVEY">Drone Health Survey</option>
                <option value="IRRIGATION">Irrigation Protocol</option>
                <option value="MAINTENANCE">Equipment Servicing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Assign Machinery / Worker</label>
              <select
                value={assignedResourceId || ''}
                onChange={(e) => setAssignedResourceId(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="">-- Auto-Assign Nearest IDLE --</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type} - Farm #{r.currentFarmId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value={1}>P1 - Critical (Immediate Dispatch)</option>
                <option value={2}>P2 - High Urgency</option>
                <option value={3}>P3 - Standard Schedule</option>
                <option value={4}>P4 - Low Urgency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Execution Slot Window</label>
            <input
              type="text"
              placeholder="e.g. 14:00 - 16:30"
              value={scheduledSlot}
              onChange={(e) => setScheduledSlot(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-5 py-2 text-xs font-bold shadow-sm"
            >
              {submitting ? 'Dispatching...' : 'Dispatch Task to Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
