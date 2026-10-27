import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { farms, resources, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateFarm, deleteFarm } from '@/db/actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const farmId = parseInt(id, 10);

    const [farm] = await db.select().from(farms).where(eq(farms.id, farmId));
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }

    const [farmResources, farmTasks] = await Promise.all([
      db.select().from(resources).where(eq(resources.currentFarmId, farmId)),
      db.select().from(tasks).where(eq(tasks.farmId, farmId)),
    ]);

    return NextResponse.json({
      farm,
      resources: farmResources,
      tasks: farmTasks,
    });
  } catch (error) {
    console.error('Failed to get farm:', error);
    return NextResponse.json({ error: 'Failed to fetch farm' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const farmId = parseInt(id, 10);
    const body = await request.json();

    const state = await updateFarm(farmId, body);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to update farm:', error);
    return NextResponse.json({ error: 'Failed to update farm' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const farmId = parseInt(id, 10);

    const state = await deleteFarm(farmId);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to delete farm:', error);
    return NextResponse.json({ error: 'Failed to delete farm' }, { status: 500 });
  }
}
