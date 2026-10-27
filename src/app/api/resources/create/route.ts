import { NextRequest, NextResponse } from 'next/server';
import { createResource } from '@/db/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = await createResource({
      name: body.name,
      type: body.type,
      currentFarmId: parseInt(body.currentFarmId, 10),
      fuelOrBattery: body.fuelOrBattery ? parseInt(body.fuelOrBattery, 10) : 100,
      model: body.model,
    });
    return NextResponse.json(state);
  } catch (error) {
    console.error('Resource creation failed:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

