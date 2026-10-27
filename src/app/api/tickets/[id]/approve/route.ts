import { NextRequest, NextResponse } from 'next/server';
import { approveTicket, getFullState } from '@/db/actions';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    await approveTicket(ticketId);
    const state = await getFullState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to approve ticket:', error);
    return NextResponse.json(
      { error: 'Failed to approve ticket' },
      { status: 500 }
    );
  }
}

