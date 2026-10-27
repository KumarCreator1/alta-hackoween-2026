import { NextRequest, NextResponse } from 'next/server';
import { createTask } from '@/db/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = await createTask({
      title: body.title,
      farmId: parseInt(body.farmId, 10),
      assignedResourceId: body.assignedResourceId ? parseInt(body.assignedResourceId, 10) : null,
      priority: body.priority ? parseInt(body.priority, 10) : 3,
      scheduledSlot: body.scheduledSlot || '09:00 - 11:00',
      category: body.category || 'FIELD_OPS',
    });
    return NextResponse.json(state);
  } catch (error) {
    console.error('Task creation failed:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
