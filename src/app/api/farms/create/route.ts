import { NextRequest, NextResponse } from 'next/server';
import { createFarm } from '@/db/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Farm name is required' }, { status: 400 });
    }
    const state = await createFarm(body);
    return NextResponse.json(state, { status: 201 });
  } catch (error) {
    console.error('Failed to create farm:', error);
    return NextResponse.json({ error: 'Failed to create farm' }, { status: 500 });
  }
}
