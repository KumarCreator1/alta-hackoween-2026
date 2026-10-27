import { NextRequest, NextResponse } from 'next/server';
import { updateTaskStatus } from '@/db/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    const body = await request.json();

    const state = await updateTaskStatus(
      taskId,
      body.status,
      body.progressPercent
    );
    return NextResponse.json(state);
  } catch (error) {
    console.error('Task update failed:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

