import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { farms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getFullState, createTicket, addEventLog } from '@/db/actions';
import { orchestrate, type CrisisEvent } from '@/lib/orchestrate';

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    // Validate incoming event
    const eventType = body.type;
    const requestedFarmId = Number(body.farmId);

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    // 1. Fetch current database state
    const currentState = await getFullState();

    // 2. Resolve a valid target farm (to strictly satisfy foreign key constraints)
    let targetFarm = null;
    if (!isNaN(requestedFarmId) && requestedFarmId > 0) {
      targetFarm = currentState.farms.find((f) => f.id === requestedFarmId);
    }

    if (!targetFarm) {
      // Fallback to first existing farm in current state
      targetFarm = currentState.farms[0];
    }

    if (!targetFarm) {
      // Direct database lookup fallback
      const [firstDbFarm] = await db.select().from(farms).limit(1);
      targetFarm = firstDbFarm;
    }

    if (!targetFarm) {
      // If DB has no farms at all, seed it automatically
      const { seedDatabase } = await import('@/db/seed');
      await seedDatabase();
      const [seededFarm] = await db.select().from(farms).limit(1);
      targetFarm = seededFarm;
    }

    if (!targetFarm) {
      return NextResponse.json(
        { error: 'Unable to resolve or initialize a valid farm sector for this event' },
        { status: 500 }
      );
    }

    const event: CrisisEvent = {
      type: eventType,
      farmId: targetFarm.id,
      payload: body.payload || {},
    };

    // 3. Log incoming event (safe logging)
    try {
      await addEventLog(
        'INFO',
        '[LOG]',
        `Incoming ${event.type} event on ${targetFarm.name} (#${targetFarm.id}): ${JSON.stringify(event.payload)}`
      );
    } catch (logErr) {
      console.warn('Non-fatal event log error:', logErr);
    }

    // 4. Update farm weather status if it's a weather event
    if (event.type === 'WEATHER_WEBHOOK' && event.payload.condition) {
      try {
        await db
          .update(farms)
          .set({ weatherStatus: event.payload.condition })
          .where(eq(farms.id, targetFarm.id));

        await addEventLog(
          'WARN',
          '[LOG]',
          `${targetFarm.name} (#${targetFarm.id}) weather updated to: ${event.payload.condition}`
        );
      } catch (weatherErr) {
        console.warn('Weather update notice:', weatherErr);
      }
    }

    // 5. Call AI orchestration engine
    const aiResult = await orchestrate(event, currentState);

    // 6. Create ticket with proposed mutations (with verified targetFarm.id)
    const ticket = await createTicket({
      farmId: targetFarm.id,
      triggerEvent: event.type,
      severity: aiResult.severity,
      summary: aiResult.executiveSummary,
      proposedMutations: aiResult.proposedMutations,
    });

    // 7. Log AI decision and ticket creation
    try {
      await addEventLog(
        aiResult.severity === 'CRITICAL' ? 'CRITICAL' : 'WARN',
        '[LOG]',
        `[TRIAGE] Severity: ${aiResult.severity}. ${aiResult.executiveSummary}`,
        ticket.id
      );

      await addEventLog(
        'INFO',
        '[LOG]',
        `Incident Ticket #${ticket.id} staged with ${aiResult.proposedMutations.length} proposed adjustment(s). Awaiting owner approval.`,
        ticket.id
      );
    } catch (logErr) {
      console.warn('Ticket log notice:', logErr);
    }

    // 8. Return updated state
    const newState = await getFullState();
    return NextResponse.json({
      ...newState,
      latestTicket: ticket,
      aiResult,
    });
  } catch (error: any) {
    console.error('Event ingestion failed:', error);
    return NextResponse.json(
      {
        error: 'Event ingestion failed',
        details: error?.message || String(error),
        code: error?.code,
      },
      { status: 500 }
    );
  }
}
