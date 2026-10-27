import { NextRequest, NextResponse } from 'next/server';
import { deleteFarm } from '@/db/actions';

export async function POST(
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
}

