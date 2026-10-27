import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAllTasks, createTask } from '@/db/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmIdParam = searchParams.get('farmId');

    if (farmIdParam) {
      const farmId = parseInt(farmIdParam, 10);
      const filtered = await db.select().from(tasks).where(eq(tasks.farmId, farmId));
      return NextResponse.json(filtered);
    }

    const all = await getAllTasks();
    return NextResponse.json(all);
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.farmId) {
      return NextResponse.json({ error: 'title and farmId are required' }, { status: 400 });
    }
    const state = await createTask({
      title: body.title,
      farmId: parseInt(body.farmId, 10),
      assignedResourceId: body.assignedResourceId ? parseInt(body.assignedResourceId, 10) : null,
      priority: body.priority ? parseInt(body.priority, 10) : 3,
      scheduledSlot: body.scheduledSlot || '09:00 - 11:00',
      category: body.category || 'FIELD_OPS',
      aiReasoning: body.aiReasoning,
    });
    return NextResponse.json(state, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

