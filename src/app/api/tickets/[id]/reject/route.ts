import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incidentTickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getFullState, addEventLog } from '@/db/actions';

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

    // Update ticket status to RESOLVED without applying mutations
    const [updatedTicket] = await db
      .update(incidentTickets)
      .set({
        status: 'RESOLVED',
      })
      .where(eq(incidentTickets.id, ticketId))
      .returning();

    if (!updatedTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Log operator override
    await addEventLog(
      'WARN',
      '[LOG][LOG]',
      `Operator overrode/rejected Ticket #${ticketId}. Proposed mutations were discarded.`,
      ticketId
    );

    const state = await getFullState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to reject ticket:', error);
    return NextResponse.json(
      { error: 'Failed to reject ticket' },
      { status: 500 }
    );
  }
}

