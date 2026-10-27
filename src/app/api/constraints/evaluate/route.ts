import { NextResponse } from 'next/server';
import { getAllFarms, getAllTasks, updateTask, addEventLog, getFullState } from '@/db/actions';
import { runWeatherTaskConstraintEvaluation } from '@/lib/weatherConstraints';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { autoResume = false } = body;

    const [farms, tasks] = await Promise.all([getAllFarms(), getAllTasks()]);
    const audit = runWeatherTaskConstraintEvaluation(farms, tasks);

    // Apply Pauses
    for (const item of audit.tasksToPause) {
      await updateTask(item.task.id, {
        status: 'PAUSED_BY_AI',
        aiReasoning: item.reason,
      });

      await addEventLog(
        'WARN',
        '[WEATHER_LOCK]',
        `Task #${item.task.id} (${item.task.title}) auto-paused: ${item.reason}`
      );
    }

    // Apply Auto-Resumes if requested and safe
    if (autoResume) {
      for (const task of audit.tasksToResume) {
        await updateTask(task.id, {
          status: 'SCHEDULED',
          aiReasoning: 'Weather constraint cleared; parameters returned within safe operational limits.',
        });

        await addEventLog(
          'INFO',
          '[WEATHER_CLEAR]',
          `Task #${task.id} (${task.title}) resumed: Environmental conditions nominal.`
        );
      }
    }

    const state = await getFullState();

    return NextResponse.json({
      success: true,
      audit,
      pausedCount: audit.tasksToPause.length,
      resumedCount: autoResume ? audit.tasksToResume.length : 0,
      state,
    });
  } catch (error) {
    console.error('Failed to evaluate weather constraints:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate weather constraints' },
      { status: 500 }
    );
  }
}

