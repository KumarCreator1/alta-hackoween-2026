import { NextResponse } from 'next/server';
import { resetDemoState, getFullState } from '@/db/actions';

export async function POST() {
  try {
    await resetDemoState();
    const state = await getFullState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to reset state:', error);
    return NextResponse.json({ error: 'Failed to reset state' }, { status: 500 });
  }
}

