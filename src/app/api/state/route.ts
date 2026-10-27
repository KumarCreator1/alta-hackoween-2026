import { NextResponse } from 'next/server';
import { getFullState } from '@/db/actions';

export async function GET() {
  try {
    const state = await getFullState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to get state:', error);
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
  }
}

