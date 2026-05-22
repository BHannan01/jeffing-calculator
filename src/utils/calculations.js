export const MILES_TO_KM = 1.60934;
export const KM_TO_MILES = 1 / MILES_TO_KM;

export const PRESET_DISTANCES_KM = {
  '5K': 5,
  '10K': 10,
  '15K': 15,
  'Half Marathon': 21.0975,
  'Marathon': 42.195,
};

// Parse "MM:SS" or "H:MM:SS" into decimal minutes
export function parseTimeToMinutes(str) {
  if (!str || typeof str !== 'string') return NaN;
  const parts = str.trim().split(':').map(Number);
  if (parts.some(isNaN)) return NaN;
  if (parts.length === 2) {
    const [m, s] = parts;
    if (s < 0 || s >= 60) return NaN;
    return m + s / 60;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (m < 0 || m >= 60 || s < 0 || s >= 60) return NaN;
    return h * 60 + m + s / 60;
  }
  return NaN;
}

// Format decimal minutes to "M:SS" or "H:MM:SS"
export function formatMinutes(minutes, forceHours = false) {
  if (!isFinite(minutes) || minutes < 0) return '--:--';
  const totalSec = Math.round(minutes * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0 || forceHours) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Pace (min/unit) + unit => speed (km/min)
export function paceToSpeedKm(paceMin, unit) {
  if (!paceMin || paceMin <= 0) return 0;
  return unit === 'km' ? 1 / paceMin : MILES_TO_KM / paceMin;
}

// Speed (km/min) => pace string for display unit
export function speedToDisplayPace(speedKmMin, unit) {
  if (!speedKmMin || speedKmMin <= 0) return '--:--';
  const paceMin = unit === 'km' ? 1 / speedKmMin : KM_TO_MILES / speedKmMin;
  return formatMinutes(paceMin);
}

// Relevant split distances (in km) for a given total
export function getSplitCheckpoints(totalKm) {
  const points = [];
  if (totalKm <= 6) {
    for (let d = 1; d < totalKm - 0.05; d++) points.push(d);
  } else if (totalKm <= 15) {
    [5, 10].forEach(d => { if (d < totalKm - 0.05) points.push(d); });
  } else {
    [5, 10, 15, 20, 21.0975, 25, 30, 35, 40, 42.195].forEach(d => {
      if (d < totalKm - 0.05) points.push(d);
    });
  }
  points.push(totalKm);
  return points;
}

// Cumulative time (minutes) to cover distKm with the given jeffing config
function timeAtDistKm(distKm, runSpeedKm, walkSpeedKm, intervalType, runInterval, walkInterval) {
  if (distKm <= 0) return 0;

  if (intervalType === 'time') {
    // runInterval / walkInterval are in minutes
    const cycleMin = runInterval + walkInterval;
    const distPerCycle = runSpeedKm * runInterval + walkSpeedKm * walkInterval;
    if (distPerCycle <= 0) return Infinity;

    const fullCycles = Math.floor(distKm / distPerCycle);
    const rem = distKm - fullCycles * distPerCycle;
    const runDistInCycle = runSpeedKm * runInterval;

    const partial = rem <= runDistInCycle
      ? rem / runSpeedKm
      : runInterval + (rem - runDistInCycle) / walkSpeedKm;

    return fullCycles * cycleMin + partial;
  } else {
    // runInterval / walkInterval are in km
    const cycleDist = runInterval + walkInterval;
    if (cycleDist <= 0) return Infinity;
    const cycleMin = runInterval / runSpeedKm + walkInterval / walkSpeedKm;

    const fullCycles = Math.floor(distKm / cycleDist);
    const rem = distKm - fullCycles * cycleDist;

    const partial = rem <= runInterval
      ? rem / runSpeedKm
      : runInterval / runSpeedKm + (rem - runInterval) / walkSpeedKm;

    return fullCycles * cycleMin + partial;
  }
}

function buildResults(totalKm, runSpeedKm, walkSpeedKm, intervalType, runInterval, walkInterval) {
  const totalMin = timeAtDistKm(totalKm, runSpeedKm, walkSpeedKm, intervalType, runInterval, walkInterval);
  if (!isFinite(totalMin) || totalMin <= 0) return null;

  const avgSpeedKm = totalKm / totalMin;

  let runFraction;
  if (intervalType === 'time') {
    runFraction = runInterval / (runInterval + walkInterval);
  } else {
    const rt = runInterval / runSpeedKm;
    const wt = walkInterval / walkSpeedKm;
    runFraction = rt / (rt + wt);
  }

  const splitCheckpoints = getSplitCheckpoints(totalKm);
  const splits = splitCheckpoints.map(d => ({
    distKm: d,
    timeMin: timeAtDistKm(d, runSpeedKm, walkSpeedKm, intervalType, runInterval, walkInterval),
  }));

  // ~300 chart points for smooth line
  const nPoints = Math.min(300, Math.ceil(totalKm * 20));
  const step = totalKm / nPoints;
  const chartPoints = Array.from({ length: nPoints + 1 }, (_, i) => {
    const d = Math.min(i * step, totalKm);
    return { distKm: d, timeMin: timeAtDistKm(d, runSpeedKm, walkSpeedKm, intervalType, runInterval, walkInterval) };
  });

  return { totalMin, runSpeedKm, walkSpeedKm, avgSpeedKm, runFraction, splits, chartPoints };
}

// Mode: find required run pace given goal time
export function calcRequiredRunPace({ totalKm, goalMin, walkSpeedKm, intervalType, runInterval, walkInterval }) {
  let runSpeedKm;

  if (intervalType === 'time') {
    const cycleMin = runInterval + walkInterval;
    const rhs = (totalKm * cycleMin) / goalMin;
    runSpeedKm = (rhs - walkSpeedKm * walkInterval) / runInterval;
  } else {
    const cycleDist = runInterval + walkInterval;
    const cycleMin = goalMin * cycleDist / totalKm;
    const walkTime = walkInterval / walkSpeedKm;
    if (cycleMin <= walkTime) {
      return { error: 'Goal time is faster than walking the full distance. Try a shorter goal time.' };
    }
    runSpeedKm = runInterval / (cycleMin - walkTime);
  }

  if (!isFinite(runSpeedKm) || runSpeedKm <= 0) {
    return { error: 'No valid run pace found. Try adjusting your goal time or walk pace.' };
  }
  if (runSpeedKm <= walkSpeedKm) {
    return { error: 'The required run pace is slower than your walk pace. Try a shorter goal time.' };
  }

  const results = buildResults(totalKm, runSpeedKm, walkSpeedKm, intervalType, runInterval, walkInterval);
  return results || { error: 'Calculation error. Please check your inputs.' };
}

// Mode: find finish time given both paces
export function calcFinishTime({ totalKm, runSpeedKm, walkSpeedKm, intervalType, runInterval, walkInterval }) {
  if (runSpeedKm <= walkSpeedKm) {
    return { error: 'Run pace must be faster than walk pace.' };
  }
  const results = buildResults(totalKm, runSpeedKm, walkSpeedKm, intervalType, runInterval, walkInterval);
  return results || { error: 'Calculation error. Please check your inputs.' };
}
