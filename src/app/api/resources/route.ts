import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAllResources, createResource } from '@/db/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmIdParam = searchParams.get('farmId');

    if (farmIdParam) {
      const farmId = parseInt(farmIdParam, 10);
      const filtered = await db.select().from(resources).where(eq(resources.currentFarmId, farmId));
      return NextResponse.json(filtered);
    }

    const all = await getAllResources();
    return NextResponse.json(all);
  } catch (error) {
    console.error('Failed to get resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.type || !body.currentFarmId) {
      return NextResponse.json(
        { error: 'name, type, and currentFarmId are required' },
        { status: 400 }
      );
    }
    const state = await createResource({
      name: body.name,
      type: body.type,
      currentFarmId: parseInt(body.currentFarmId, 10),
      fuelOrBattery: body.fuelOrBattery ? parseInt(body.fuelOrBattery, 10) : 100,
      model: body.model,
    });
    return NextResponse.json(state, { status: 201 });
  } catch (error) {
    console.error('Failed to create resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

