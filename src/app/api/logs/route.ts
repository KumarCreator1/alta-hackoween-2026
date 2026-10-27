import { NextRequest } from 'next/server';
import { db } from '@/db';
import { eventLogs } from '@/db/schema';
import { gt, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let lastId = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const sendLogs = async () => {
        try {
          const newLogs = await db
            .select()
            .from(eventLogs)
            .where(gt(eventLogs.id, lastId))
            .orderBy(desc(eventLogs.id))
            .limit(20);

          if (newLogs.length > 0) {
            lastId = Math.max(...newLogs.map((l) => l.id));
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(newLogs.reverse())}\n\n`)
            );
          }
        } catch (e) {
          // Silently handle DB errors during polling
        }
      };

      // Send initial batch
      await sendLogs();

      // Poll every 1.5 seconds
      const interval = setInterval(sendLogs, 1500);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Controller may already be closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

