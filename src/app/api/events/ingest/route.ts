import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { farms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getFullState, createTicket, addEventLog } from '@/db/actions';
import { orchestrate, type CrisisEvent } from '@/lib/orchestrate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate incoming event
    const event: CrisisEvent = {
      type: body.type,
      farmId: body.farmId,
      payload: body.payload || {},
    };

    if (!event.type || !event.farmId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, farmId' },
        { status: 400 }
      );
    }

    // 3. Get current state for the AI orchestrator
    const currentState = await getFullState();

    // Ensure target farmId exists, otherwise fallback to first available farm
    const targetFarm = currentState.farms.find((f) => f.id === event.farmId) || currentState.farms[0];
    if (targetFarm) {
      event.farmId = targetFarm.id;
    }

    // 1. Log incoming event
    await addEventLog(
      'INFO',
      '⚡',
      `Incoming ${event.type} event on Farm #${event.farmId} (${targetFarm?.name || 'Sector'}): ${JSON.stringify(event.payload)}`
    );

    // 2. Update farm weather status if it's a weather event
    if (event.type === 'WEATHER_WEBHOOK' && event.payload.condition && targetFarm) {
      await db
        .update(farms)
        .set({ weatherStatus: event.payload.condition })
        .where(eq(farms.id, targetFarm.id));

      await addEventLog(
        'WARN',
        '⛈️',
        `Farm #${targetFarm.id} (${targetFarm.name}) weather status updated to: ${event.payload.condition}`
      );
    }

    // 4. Call orchestration engine
    await addEventLog(
      'AI',
      '🤖',
      `AI Orchestration Engine analyzing ${event.type} crisis...`
    );

    const aiResult = await orchestrate(event, currentState);

    // 5. Create ticket with proposed mutations
    const ticket = await createTicket({
      farmId: event.farmId,
      triggerEvent: event.type,
      severity: aiResult.severity,
      summary: aiResult.executiveSummary,
      proposedMutations: aiResult.proposedMutations,
    });

    // 6. Log AI decision and ticket creation
    await addEventLog(
      aiResult.severity === 'CRITICAL' ? 'CRITICAL' : 'WARN',
      '🚨',
      `[AI TRIAGE] Severity: ${aiResult.severity}. ${aiResult.executiveSummary}`,
      ticket.id
    );

    await addEventLog(
      'INFO',
      '📋',
      `Incident Ticket #${ticket.id} staged with ${aiResult.proposedMutations.length} proposed mutation(s). Awaiting operator approval.`,
      ticket.id
    );

    // 7. Return updated state
    const newState = await getFullState();
    return NextResponse.json({
      ...newState,
      latestTicket: ticket,
      aiResult,
    });
  } catch (error) {
    console.error('Event ingestion failed:', error);
    return NextResponse.json(
      { error: 'Event ingestion failed' },
      { status: 500 }
    );
  }
}

