import { NextResponse } from 'next/server';
import { getActiveTickets } from '@/db/actions';

export async function GET() {
  try {
    const tickets = await getActiveTickets();
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Failed to get tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}
