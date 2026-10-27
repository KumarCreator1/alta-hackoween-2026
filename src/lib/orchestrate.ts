import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Types
export interface CrisisEvent {
  type: 'WEATHER_WEBHOOK' | 'CV_DISEASE_REPORT' | 'EQUIPMENT_FAILURE';
  farmId: number;
  payload: {
    condition?: string;
    disease?: string;
    imageBase64?: string;
    equipmentId?: number;
    failureType?: string;
  };
}

export interface SystemState {
  farms: any[];
  resources: any[];
  tasks: any[];
  tickets: any[];
}

export interface ProposedMutation {
  action: 'PAUSE_TASK' | 'CREATE_TASK' | 'REASSIGN_RESOURCE';
  targetId?: number;
  resourceId?: number;
  fromFarmId?: number;
  toFarmId?: number;
  newTaskTitle?: string;
  reason: string;
}

export interface OrchestrateResult {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  executiveSummary: string;
  proposedMutations: ProposedMutation[];
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    severity: {
      type: SchemaType.STRING,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM'],
      description: 'Severity level of the incident',
    },
    executiveSummary: {
      type: SchemaType.STRING,
      description:
        'Two-sentence executive summary for the farm manager explaining what happened and what the AI recommends',
    },
    proposedMutations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          action: {
            type: SchemaType.STRING,
            enum: ['PAUSE_TASK', 'CREATE_TASK', 'REASSIGN_RESOURCE'],
          },
          targetId: {
            type: SchemaType.NUMBER,
            description: 'Task ID to pause (for PAUSE_TASK)',
            nullable: true,
          },
          resourceId: {
            type: SchemaType.NUMBER,
            description: 'Resource ID to reassign (for REASSIGN_RESOURCE)',
            nullable: true,
          },
          fromFarmId: {
            type: SchemaType.NUMBER,
            description: 'Source farm for resource transfer',
            nullable: true,
          },
          toFarmId: {
            type: SchemaType.NUMBER,
            description: 'Destination farm for resource transfer',
            nullable: true,
          },
          newTaskTitle: {
            type: SchemaType.STRING,
            description: 'Title for new emergency task (for CREATE_TASK)',
            nullable: true,
          },
          reason: {
            type: SchemaType.STRING,
            description: 'Human-readable reason for this mutation',
          },
        },
        required: ['action', 'reason'],
      },
    },
  },
  required: ['severity', 'executiveSummary', 'proposedMutations'],
};

const SYSTEM_PROMPT = `You are the AI Orchestration Engine for PARALLAX ARM (Agricultural Resource Management), an autonomous farm operations system managing multiple farm sectors.

Your job: Given a crisis event and the current database state of all farms, resources, and tasks, produce an EXECUTABLE MUTATION PLAN that the system will apply to the database.

CRITICAL RULES:
1. WEATHER WASH-OFF: Never allow spraying, fertilizing, or irrigation tasks to remain SCHEDULED if a farm has HEAVY_RAIN_WARNING or storm conditions. Issue PAUSE_TASK mutations immediately for any such tasks.
2. CROSS-FARM RESOURCE STEALING: If a CRITICAL incident requires a specialized resource (sprayer, harvester, drone) that is currently IDLE or assigned to a low-priority (priority >= 4) task at ANOTHER farm, issue a REASSIGN_RESOURCE mutation to route it cross-farm.
3. ZERO DOUBLE-BOOKING: A single resource cannot hold two active tasks in the same time slot.
4. Always create an emergency task (CREATE_TASK) for the crisis response action needed.
5. Keep the executiveSummary to exactly 2 sentences: what happened and what you recommend.

REFERENCE EXISTING IDs: Use the actual task IDs and resource IDs from the state provided. Don't invent IDs.

You must respond with valid JSON matching the schema.`;

export async function orchestrate(
  event: CrisisEvent,
  state: SystemState
): Promise<OrchestrateResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // FALLBACK: If no API key, use deterministic fallback logic
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return generateFallbackResponse(event, state);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema as any,
      },
    });

    const userPrompt = buildUserPrompt(event, state);

    // If there's an image, use multimodal
    const parts: any[] = [{ text: userPrompt }];
    if (event.payload.imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: event.payload.imageBase64,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      systemInstruction: SYSTEM_PROMPT,
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as OrchestrateResult;
    return parsed;
  } catch (error) {
    console.error('Gemini API error, falling back to deterministic logic:', error);
    return generateFallbackResponse(event, state);
  }
}

function buildUserPrompt(event: CrisisEvent, state: SystemState): string {
  return `CRISIS EVENT:
Type: ${event.type}
Affected Farm ID: ${event.farmId}
Payload: ${JSON.stringify(event.payload)}

CURRENT DATABASE STATE:

FARMS:
${JSON.stringify(state.farms, null, 2)}

RESOURCES (Equipment & Workers):
${JSON.stringify(state.resources, null, 2)}

ACTIVE TASKS:
${JSON.stringify(state.tasks, null, 2)}

Analyze this crisis and produce the mutation plan.`;
}

function generateFallbackResponse(
  event: CrisisEvent,
  state: SystemState
): OrchestrateResult {
  const mutations: ProposedMutation[] = [];
  const affectedFarm = state.farms.find((f: any) => f.id === event.farmId);
  const otherFarm = state.farms.find((f: any) => f.id !== event.farmId);

  if (event.type === 'WEATHER_WEBHOOK') {
    // Pause all spray/irrigation/fertilizer tasks on the affected farm
    const tasksToStop = state.tasks.filter(
      (t: any) =>
        t.farmId === event.farmId &&
        t.status === 'SCHEDULED' &&
        (t.title.toLowerCase().includes('spray') ||
          t.title.toLowerCase().includes('irrigat') ||
          t.title.toLowerCase().includes('fertiliz') ||
          t.title.toLowerCase().includes('foliar'))
    );
    for (const task of tasksToStop) {
      mutations.push({
        action: 'PAUSE_TASK',
        targetId: task.id,
        reason: `${event.payload.condition || 'Severe weather'} detected — chemical application would be washed away, wasting resources and causing environmental runoff.`,
      });
    }
    // Create emergency weather prep task
    mutations.push({
      action: 'CREATE_TASK',
      toFarmId: event.farmId,
      newTaskTitle: `Emergency Weather Protection — Secure Equipment & Cover Crops`,
      reason: `${event.payload.condition || 'Storm'} incoming. All exposed equipment must be secured and vulnerable crop sections covered.`,
    });

    return {
      severity: 'HIGH',
      executiveSummary: `${event.payload.condition || 'Severe weather alert'} detected on ${affectedFarm?.name || 'target farm'}. AI has paused ${tasksToStop.length} chemical application task(s) to prevent wash-off and created an emergency weather preparation task.`,
      proposedMutations: mutations,
    };
  }

  if (event.type === 'CV_DISEASE_REPORT') {
    // Find idle sprayer/harvester on other farm to reassign
    const availableResource = state.resources.find(
      (r: any) =>
        r.currentFarmId !== event.farmId &&
        (r.type === 'HARVESTER' || r.type === 'DRONE') &&
        (r.status === 'IDLE' || r.status === 'BUSY')
    );

    // Pause low-priority tasks on affected farm
    const lowPriTasks = state.tasks.filter(
      (t: any) =>
        t.farmId === event.farmId &&
        t.status === 'SCHEDULED' &&
        t.priority >= 4
    );
    for (const task of lowPriTasks) {
      mutations.push({
        action: 'PAUSE_TASK',
        targetId: task.id,
        reason: `Low-priority task paused to prioritize disease containment response.`,
      });
    }

    if (availableResource) {
      mutations.push({
        action: 'REASSIGN_RESOURCE',
        resourceId: availableResource.id,
        fromFarmId: availableResource.currentFarmId,
        toFarmId: event.farmId,
        reason: `Cross-farm reallocation: ${availableResource.name} routed from ${otherFarm?.name || 'other sector'} to contain ${event.payload.disease || 'disease outbreak'} before it spreads.`,
      });
    }

    mutations.push({
      action: 'CREATE_TASK',
      toFarmId: event.farmId,
      newTaskTitle: `Emergency Fungicide Application — ${event.payload.disease || 'Disease'} Containment`,
      resourceId: availableResource?.id,
      reason: `Immediate copper fungicide application required to contain ${event.payload.disease || 'pathogen'} spread.`,
    });

    return {
      severity: 'CRITICAL',
      executiveSummary: `${event.payload.disease || 'Crop disease'} detected on ${affectedFarm?.name || 'target farm'} via computer vision analysis. AI is routing ${availableResource?.name || 'nearest available sprayer'} cross-farm and deploying emergency fungicide protocol.`,
      proposedMutations: mutations,
    };
  }

  // EQUIPMENT_FAILURE
  const failedResource = event.payload.equipmentId
    ? state.resources.find((r: any) => r.id === event.payload.equipmentId)
    : null;

  // Find replacement from other farm
  const replacement = state.resources.find(
    (r: any) =>
      r.currentFarmId !== event.farmId &&
      r.type === (failedResource?.type || 'TRACTOR') &&
      r.status === 'IDLE'
  );

  // Pause tasks assigned to failed equipment
  const affectedTasks = state.tasks.filter(
    (t: any) =>
      t.assignedResourceId === event.payload.equipmentId &&
      (t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS')
  );
  for (const task of affectedTasks) {
    mutations.push({
      action: 'PAUSE_TASK',
      targetId: task.id,
      reason: `Task paused due to ${event.payload.failureType || 'equipment failure'} on assigned resource.`,
    });
  }

  if (replacement) {
    mutations.push({
      action: 'REASSIGN_RESOURCE',
      resourceId: replacement.id,
      fromFarmId: replacement.currentFarmId,
      toFarmId: event.farmId,
      reason: `${replacement.name} routed from ${otherFarm?.name || 'other sector'} to replace failed ${failedResource?.name || 'equipment'}.`,
    });
  }

  mutations.push({
    action: 'CREATE_TASK',
    toFarmId: event.farmId,
    newTaskTitle: `Emergency Repair — ${failedResource?.name || 'Equipment'} ${event.payload.failureType || 'Failure'}`,
    reason: `Maintenance crew dispatched for ${event.payload.failureType || 'equipment failure'} repair.`,
  });

  return {
    severity: 'CRITICAL',
    executiveSummary: `${event.payload.failureType || 'Equipment failure'} reported on ${failedResource?.name || 'equipment'} at ${affectedFarm?.name || 'target farm'}. AI has paused ${affectedTasks.length} affected task(s) and is routing ${replacement?.name || 'backup equipment'} cross-farm as replacement.`,
    proposedMutations: mutations,
  };
}
