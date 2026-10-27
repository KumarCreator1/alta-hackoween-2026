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
    fieldSection?: string;
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
  const [farmId, setFarmId] = useState<number>(farms[0]?.id || 1);
  const [assignedResourceId, setAssignedResourceId] = useState<number | null>(null);
  const [priority, setPriority] = useState(2);
  const [scheduledSlot, setScheduledSlot] = useState('09:00 - 11:30');
  const [category, setCategory] = useState('SPRAYING');
  const [fieldSection, setFieldSection] = useState('Section A1');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const employeesAtFarm = resources.filter(
    (r) => r.type === 'WORKER' && r.currentFarmId === farmId
  );
  const otherEmployees = resources.filter(
    (r) => r.type === 'WORKER' && r.currentFarmId !== farmId
  );
  const machineryAtFarm = resources.filter(
    (r) => r.type !== 'WORKER' && r.currentFarmId === farmId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAddTask({
        title: title.trim(),
        farmId,
        assignedResourceId,
        priority,
        scheduledSlot: scheduledSlot.trim(),
        category,
        fieldSection: fieldSection.trim(),
      });
      onClose();
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-stone-300 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              Create New Work Order
            </h3>
            <p className="text-xs text-stone-500">
              Assign task mission, schedule window, and responsible employee
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Variable-Rate Nitrogen Application"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Target Sector</label>
              <select
                value={farmId}
                onChange={(e) => {
                  const newId = parseInt(e.target.value, 10);
                  setFarmId(newId);
                  setAssignedResourceId(null);
                }}
                className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} - {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
              >
                <option value="SPRAYING">Chemical Spraying</option>
                <option value="TILLAGE">Tillage & Preparation</option>
                <option value="HARVEST">Harvesting</option>
                <option value="SURVEY">Aerial Drone Survey</option>
                <option value="IRRIGATION">Irrigation Protocol</option>
                <option value="FIELD_OPS">General Field Operations</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Responsible Employee / Implement
              </label>
              <select
                value={assignedResourceId || ''}
                onChange={(e) =>
                  setAssignedResourceId(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
              >
                <option value="">-- Unassigned (Standby) --</option>
                {employeesAtFarm.length > 0 && (
                  <optgroup label={`Employees Stationed at this Farm (${employeesAtFarm.length})`}>
                    {employeesAtFarm.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.model || 'Operator'})
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherEmployees.length > 0 && (
                  <optgroup label="Employees at Other Sectors">
                    {otherEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} (Stationed at Farm #{e.currentFarmId})
                      </option>
                    ))}
                  </optgroup>
                )}
                {machineryAtFarm.length > 0 && (
                  <optgroup label={`Machinery at this Sector (${machineryAtFarm.length})`}>
                    {machineryAtFarm.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Priority Order</label>
              <select
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500 font-medium"
              >
                <option value={1}>P1 - Urgent (Immediate Execution)</option>
                <option value={2}>P2 - High Priority</option>
                <option value={3}>P3 - Normal</option>
                <option value={4}>P4 - Low Urgency</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Schedule At (Slot)</label>
              <input
                type="text"
                placeholder="e.g. 09:00 - 11:30"
                value={scheduledSlot}
                onChange={(e) => setScheduledSlot(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Field Section</label>
              <input
                type="text"
                placeholder="e.g. Section A3"
                value={fieldSection}
                onChange={(e) => setFieldSection(e.target.value)}
                className="w-full px-3 py-1.5 bg-stone-50 rounded border border-stone-300 focus:bg-white focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 rounded font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-stone-900 text-white rounded font-semibold hover:bg-stone-800 disabled:opacity-50"
            >
              {submitting ? 'Dispatching...' : 'Dispatch Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
