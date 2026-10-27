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
 * Evaluates the 4 core agronomic constraints for a given sector
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

  // 1. Chemical Wash-off Constraint (Category: SPRAYING / FERTILIZATION)
  if (isRainForecast) {
    constraints.push({
      type: 'WASH_OFF',
      name: 'Chemical Wash-Off Hazard',
      severity: 'LOCKED_OUT',
      category: 'SPRAYING',
      threshold: '0% Rain in 4h Window',
      currentValue: farm.weatherStatus,
      reason: 'Precipitation forecast will wash active pesticide/fungicide into runoff prior to 4-hour absorption.',
    });
  } else {
    constraints.push({
      type: 'WASH_OFF',
      name: 'Chemical Wash-Off Hazard',
      severity: 'SAFE',
      category: 'SPRAYING',
      threshold: '0% Rain in 4h Window',
      currentValue: farm.weatherStatus || 'Clear',
      reason: 'No precipitation forecast; safe absorption window open.',
    });
  }

  // 2. Wind Drift Velocity Constraint (Category: SPRAYING)
  if (wind > 20) {
    constraints.push({
      type: 'WIND_DRIFT',
      name: 'Spray Droplet Drift Hazard',
      severity: 'LOCKED_OUT',
      category: 'SPRAYING',
      threshold: 'Max 15 km/h',
      currentValue: `${wind} km/h`,
      reason: `Wind velocity (${wind} km/h) exceeds 20 km/h critical ceiling; severe off-target droplet dispersion.`,
    });
  } else if (wind > 15) {
    constraints.push({
      type: 'WIND_DRIFT',
      name: 'Spray Droplet Drift Hazard',
      severity: 'WARNING',
      category: 'SPRAYING',
      threshold: 'Max 15 km/h',
      currentValue: `${wind} km/h`,
      reason: `Wind velocity (${wind} km/h) exceeds 15 km/h advisory limit; use low-drift air-induction nozzles.`,
    });
  } else {
    constraints.push({
      type: 'WIND_DRIFT',
      name: 'Spray Droplet Drift Hazard',
      severity: 'SAFE',
      category: 'SPRAYING',
      threshold: 'Max 15 km/h',
      currentValue: `${wind} km/h`,
      reason: 'Wind velocity nominal for standard boom application.',
    });
  }

  // 3. Soil Structural Compaction Constraint (Category: TILLAGE / HARVESTING)
  const isSaturated = moisture > maxMoisture + 5 || (moisture > 70 && isRainForecast);
  if (isSaturated) {
    constraints.push({
      type: 'SOIL_COMPACTION',
      name: 'Subsoil Plow Pan Compaction',
      severity: 'LOCKED_OUT',
      category: 'TILLAGE',
      threshold: `Max ${maxMoisture}% Moisture`,
      currentValue: `${moisture}%`,
      reason: `Soil moisture (${moisture}%) exceeds safe axle limit (${maxMoisture}%); heavy tractors risk irreversible compaction.`,
    });
  } else if (moisture > maxMoisture) {
    constraints.push({
      type: 'SOIL_COMPACTION',
      name: 'Subsoil Plow Pan Compaction',
      severity: 'WARNING',
      category: 'TILLAGE',
      threshold: `Max ${maxMoisture}% Moisture`,
      currentValue: `${moisture}%`,
      reason: `Soil moisture (${moisture}%) marginally elevated; operate dual-wheel low-pressure tires.`,
    });
  } else {
    constraints.push({
      type: 'SOIL_COMPACTION',
      name: 'Subsoil Plow Pan Compaction',
      severity: 'SAFE',
      category: 'TILLAGE',
      threshold: `Max ${maxMoisture}% Moisture`,
      currentValue: `${moisture}%`,
      reason: 'Soil tension optimal for tillage and seeding without shear damage.',
    });
  }

  // 4. Aerial Drone Envelope Constraint (Category: SURVEY)
  if (wind > 22 || isRainForecast) {
    constraints.push({
      type: 'DRONE_ENVELOPE',
      name: 'UAV Flight Envelope Limits',
      severity: 'LOCKED_OUT',
      category: 'SURVEY',
      threshold: 'Max 22 km/h & No Rain',
      currentValue: `${wind} km/h, ${farm.weatherStatus}`,
      reason: `Environmental parameters exceed agricultural hexacopter stability and gimbal precision envelope.`,
    });
  } else {
    constraints.push({
      type: 'DRONE_ENVELOPE',
      name: 'UAV Flight Envelope Limits',
      severity: 'SAFE',
      category: 'SURVEY',
      threshold: 'Max 22 km/h & No Rain',
      currentValue: `${wind} km/h`,
      reason: 'Flight corridor clear for RTK multispectral surveys.',
    });
  }

  const hasLockout = constraints.some((c) => c.severity === 'LOCKED_OUT');
  const hasWarning = constraints.some((c) => c.severity === 'WARNING');
  const overallStatus = hasLockout ? 'LOCKED_OUT' : hasWarning ? 'WARNING' : 'SAFE';

  // Find all tasks at this farm that match locked-out categories
  const affectedTasks = farmTasks.filter((t) => {
    if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
    const cat = (t.category || '').toUpperCase();
    return constraints.some((c) => c.severity === 'LOCKED_OUT' && c.category === cat);
  });

  return {
    farmId: farm.id,
    farmCode: farm.code || `SEC-0${farm.id}`,
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
 * Runs full matrix evaluation across all enterprise sectors and tasks
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

    // Evaluate each active task at this farm
    for (const task of farmTasks) {
      if (task.status === 'COMPLETED' || task.status === 'CANCELLED') continue;

      const cat = (task.category || '').toUpperCase();
      const violatedConstraint = report.constraints.find(
        (c) => c.severity === 'LOCKED_OUT' && c.category === cat
      );

      if (violatedConstraint) {
        if (task.status !== 'PAUSED_BY_AI') {
          tasksToPause.push({
            task,
            reason: `[CONSTRAINT_VIOLATION] ${violatedConstraint.name}: ${violatedConstraint.reason}`,
          });
        }
      } else {
        // If it was paused by AI for a weather constraint, but conditions are now SAFE:
        if (
          task.status === 'PAUSED_BY_AI' &&
          task.aiReasoning?.includes('[CONSTRAINT_VIOLATION]')
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
