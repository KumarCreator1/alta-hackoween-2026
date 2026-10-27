import { NextRequest, NextResponse } from 'next/server';
import { updateFarm } from '@/db/actions';

export async function POST(
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
    console.error('Farm update failed:', error);
    return NextResponse.json({ error: 'Failed to update farm' }, { status: 500 });
  }
}
