import { NextRequest, NextResponse } from 'next/server';
import { updateResource } from '@/db/actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = parseInt(id, 10);
    const body = await request.json();

    const state = await updateResource(resourceId, body);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Resource update failed:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

