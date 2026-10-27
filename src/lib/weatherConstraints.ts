import type { Farm, Task } from '@/db/schema';

export interface ConstraintEvaluation {
  type: 'WASH_OFF' | 'WIND_DRIFT' | 'SOIL_COMPACTION' | 'DRONE_ENVELOPE';
  name: string;
  severity: 'LOCKED_OUT' | 'WARNING' | 'SAFE';
  category: string;
  threshold: string;
  currentValue: string;
  reason: string;
}

export interface SectorConstraintReport {
  farmId: number;
  farmCode: string;
  farmName: string;
  weatherStatus: string;
  windSpeedKmh: number;
  soilMoisture: number;
  targetMoistureMax: number;
  constraints: ConstraintEvaluation[];
  overallStatus: 'LOCKED_OUT' | 'WARNING' | 'SAFE';
  affectedTasks: Task[];
}

export interface ConstraintAuditResult {
  reports: SectorConstraintReport[];
  tasksToPause: { task: Task; reason: string }[];
  tasksToResume: Task[];
  totalViolations: number;
}

/**
 * Evaluates weather & soil conditions for a farm using simple, plain-English rules
 */
export function evaluateSectorConstraints(farm: Farm, farmTasks: Task[] = []): SectorConstraintReport {
  const weather = (farm.weatherStatus || '').toLowerCase();
  const wind = farm.windSpeedKmh || 0;
  const moisture = farm.soilMoisture || 0;
  const maxMoisture = farm.targetMoistureMax || 70;

  const isRainForecast =
    weather.includes('rain') ||
    weather.includes('storm') ||
    weather.includes('shower') ||
    weather.includes('precipitation') ||
    weather.includes('heavy_rain_warning');

  const constraints: ConstraintEvaluation[] = [];

  // 1. Rain Wash-off (Spraying & Fertilizing)
  if (isRainForecast) {
    constraints.push({
      type: 'WASH_OFF',
      name: 'Rain Wash-off Alert',
      severity: 'LOCKED_OUT',
      category: 'Spraying',
      threshold: 'No rain forecast',
      currentValue: farm.weatherStatus,
      reason: 'Rain is coming soon. Spraying now will wash the medicine away and waste your money. Paused until rain clears.',
    });
  } else {
    constraints.push({
      type: 'WASH_OFF',
      name: 'Rain Wash-off Alert',
      severity: 'SAFE',
      category: 'Spraying',
      threshold: 'No rain forecast',
      currentValue: farm.weatherStatus || 'Clear',
      reason: 'No rain in sight. Safe to spray.',
    });
  }

  // 2. High Wind (Spraying)
  if (wind > 20) {
    constraints.push({
      type: 'WIND_DRIFT',
      name: 'High Wind Warning',
      severity: 'LOCKED_OUT',
      category: 'Spraying',
      threshold: 'Below 15 km/h',
      currentValue: `${wind} km/h`,
      reason: `Too windy (${wind} km/h). The spray will blow away onto neighboring fences instead of your crop.`,
    });
  } else if (wind > 15) {
    constraints.push({
      type: 'WIND_DRIFT',
      name: 'Wind Advisory',
      severity: 'WARNING',
      category: 'Spraying',
      threshold: 'Below 15 km/h',
      currentValue: `${wind} km/h`,
      reason: `Getting breezy (${wind} km/h). Keep spray nozzles close to the crop.`,
    });
  } else {
    constraints.push({
      type: 'WIND_DRIFT',
      name: 'Wind Speed',
      severity: 'SAFE',
      category: 'Spraying',
      threshold: 'Below 15 km/h',
      currentValue: `${wind} km/h`,
      reason: 'Wind is calm. Perfect conditions for spraying.',
    });
  }

  // 3. Muddy Soil (Plowing / Heavy Tractors)
  const isMuddy = moisture > maxMoisture + 5 || (moisture > 70 && isRainForecast);
  if (isMuddy) {
    constraints.push({
      type: 'SOIL_COMPACTION',
      name: 'Muddy Soil Alert',
      severity: 'LOCKED_OUT',
      category: 'Plowing',
      threshold: `Under ${maxMoisture}% Moisture`,
      currentValue: `${moisture}%`,
      reason: `Soil is too wet and muddy (${moisture}%). Heavy tractors will get stuck and pack the mud hard. Let it dry first.`,
    });
  } else if (moisture > maxMoisture) {
    constraints.push({
      type: 'SOIL_COMPACTION',
      name: 'Damp Soil Advisory',
      severity: 'WARNING',
      category: 'Plowing',
      threshold: `Under ${maxMoisture}% Moisture`,
      currentValue: `${moisture}%`,
      reason: `Soil is damp (${moisture}%). Drive carefully to avoid rutting.`,
    });
  } else {
    constraints.push({
      type: 'SOIL_COMPACTION',
      name: 'Soil Condition',
      severity: 'SAFE',
      category: 'Plowing',
      threshold: `Under ${maxMoisture}% Moisture`,
      currentValue: `${moisture}%`,
      reason: 'Ground is dry and firm. Ready to plow and seed.',
    });
  }

  // 4. Drone Flying Conditions
  if (wind > 22 || isRainForecast) {
    constraints.push({
      type: 'DRONE_ENVELOPE',
      name: 'Drone Flight Alert',
      severity: 'LOCKED_OUT',
      category: 'Drone Scouting',
      threshold: 'Calm & No Rain',
      currentValue: `${wind} km/h`,
      reason: `Gusty wind (${wind} km/h) or rain. Drones cannot fly safely in these conditions.`,
    });
  } else {
    constraints.push({
      type: 'DRONE_ENVELOPE',
      name: 'Drone Flight Weather',
      severity: 'SAFE',
      category: 'Drone Scouting',
      threshold: 'Calm & No Rain',
      currentValue: `${wind} km/h`,
      reason: 'Calm skies. Safe for drone flying and crop photos.',
    });
  }

  const hasLockout = constraints.some((c) => c.severity === 'LOCKED_OUT');
  const hasWarning = constraints.some((c) => c.severity === 'WARNING');
  const overallStatus = hasLockout ? 'LOCKED_OUT' : hasWarning ? 'WARNING' : 'SAFE';

  // Find all tasks at this farm that conflict with locked-out conditions
  const affectedTasks = farmTasks.filter((t) => {
    if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
    const cat = (t.category || '').toLowerCase();

    // Check if task is spraying/fertilizing and wash-off/wind is locked out
    if ((cat.includes('spray') || cat.includes('fertiliz')) && (isRainForecast || wind > 20)) {
      return true;
    }
    // Check if task is plowing/tillage and soil is muddy
    if ((cat.includes('plow') || cat.includes('till') || cat.includes('level')) && isMuddy) {
      return true;
    }
    // Check if task is drone and wind/rain is locked out
    if ((cat.includes('drone') || cat.includes('scout') || cat.includes('survey')) && (wind > 22 || isRainForecast)) {
      return true;
    }
    return false;
  });

  return {
    farmId: farm.id,
    farmCode: farm.code || farm.name.split(' - ')[0],
    farmName: farm.name,
    weatherStatus: farm.weatherStatus,
    windSpeedKmh: wind,
    soilMoisture: moisture,
    targetMoistureMax: maxMoisture,
    constraints,
    overallStatus,
    affectedTasks,
  };
}

/**
 * Runs evaluation across all farms and tasks
 */
export function runWeatherTaskConstraintEvaluation(
  farms: Farm[],
  tasks: Task[]
): ConstraintAuditResult {
  const reports: SectorConstraintReport[] = [];
  const tasksToPause: { task: Task; reason: string }[] = [];
  const tasksToResume: Task[] = [];

  for (const farm of farms) {
    const farmTasks = tasks.filter((t) => t.farmId === farm.id);
    const report = evaluateSectorConstraints(farm, farmTasks);
    reports.push(report);

    for (const task of farmTasks) {
      if (task.status === 'COMPLETED' || task.status === 'CANCELLED') continue;

      const cat = (task.category || '').toLowerCase();
      let violatedReason = '';

      const isSpraying = cat.includes('spray') || cat.includes('fertiliz');
      const isPlowing = cat.includes('plow') || cat.includes('till') || cat.includes('level');
      const isDrone = cat.includes('drone') || cat.includes('scout') || cat.includes('survey');

      const washOff = report.constraints.find((c) => c.type === 'WASH_OFF');
      const windDrift = report.constraints.find((c) => c.type === 'WIND_DRIFT');
      const soilMud = report.constraints.find((c) => c.type === 'SOIL_COMPACTION');
      const droneW = report.constraints.find((c) => c.type === 'DRONE_ENVELOPE');

      if (isSpraying && washOff?.severity === 'LOCKED_OUT') {
        violatedReason = washOff.reason;
      } else if (isSpraying && windDrift?.severity === 'LOCKED_OUT') {
        violatedReason = windDrift.reason;
      } else if (isPlowing && soilMud?.severity === 'LOCKED_OUT') {
        violatedReason = soilMud.reason;
      } else if (isDrone && droneW?.severity === 'LOCKED_OUT') {
        violatedReason = droneW.reason;
      }

      if (violatedReason) {
        if (task.status !== 'PAUSED_BY_AI') {
          tasksToPause.push({
            task,
            reason: violatedReason,
          });
        }
      } else {
        if (
          task.status === 'PAUSED_BY_AI' &&
          (task.aiReasoning?.includes('Rain is coming') ||
            task.aiReasoning?.includes('Too windy') ||
            task.aiReasoning?.includes('Soil is too wet') ||
            task.aiReasoning?.includes('Precipitation'))
        ) {
          tasksToResume.push(task);
        }
      }
    }
  }

  const totalViolations = reports.reduce((acc, r) => acc + r.affectedTasks.length, 0);

  return {
    reports,
    tasksToPause,
    tasksToResume,
    totalViolations,
  };
}
