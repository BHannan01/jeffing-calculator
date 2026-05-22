import { useState } from 'react';
import {
  PRESET_DISTANCES_KM, MILES_TO_KM, KM_TO_MILES,
  parseTimeToMinutes, formatMinutes,
  paceToSpeedKm, calcRequiredRunPace, calcFinishTime, calcMultiSegment,
} from './utils/calculations';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';

function convertPaceStr(paceStr, fromUnit, toUnit) {
  if (fromUnit === toUnit) return paceStr;
  const mins = parseTimeToMinutes(paceStr);
  if (isNaN(mins) || mins <= 0) return paceStr;
  const converted = fromUnit === 'km' ? mins * MILES_TO_KM : mins * KM_TO_MILES;
  return formatMinutes(converted);
}

function convertDist(val, fromUnit, toUnit) {
  const d = parseFloat(val);
  if (isNaN(d) || d <= 0) return val;
  return (fromUnit === 'km' ? d * KM_TO_MILES : d * MILES_TO_KM).toFixed(2);
}

export default function App() {
  const [unit, setUnit] = useState('km');
  const [mode, setMode] = useState('time');
  const [distPreset, setDistPreset] = useState('Marathon');
  const [customDist, setCustomDist] = useState('');
  const [goalTime, setGoalTime] = useState('4:00:00');
  const [runPace, setRunPace] = useState('5:30');
  const [walkPace, setWalkPace] = useState('10:00');
  const [intervalType, setIntervalType] = useState('time');
  const [runInterval, setRunInterval] = useState('4');
  const [walkInterval, setWalkInterval] = useState('1');

  const [multiSeg, setMultiSeg] = useState(false);
  const [segments, setSegments] = useState([
    { id: 1, dist: '21', runPace: '5:30', walkPace: '10:00', intervalType: 'time', runInterval: '4', walkInterval: '1' },
    { id: 2, dist: '21.195', runPace: '6:00', walkPace: '10:00', intervalType: 'time', runInterval: '3', walkInterval: '2' },
  ]);

  const [results, setResults] = useState(null);
  const [calcError, setCalcError] = useState(null);

  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;

    setRunPace(convertPaceStr(runPace, unit, newUnit));
    setWalkPace(convertPaceStr(walkPace, unit, newUnit));
    if (customDist) setCustomDist(convertDist(customDist, unit, newUnit));

    if (intervalType === 'distance') {
      const factor = unit === 'km' ? KM_TO_MILES : MILES_TO_KM;
      const ri = parseFloat(runInterval);
      const wi = parseFloat(walkInterval);
      if (!isNaN(ri) && ri > 0) setRunInterval((ri * factor).toFixed(3));
      if (!isNaN(wi) && wi > 0) setWalkInterval((wi * factor).toFixed(3));
    }

    setSegments(prev => prev.map(s => ({
      ...s,
      runPace: convertPaceStr(s.runPace, unit, newUnit),
      walkPace: convertPaceStr(s.walkPace, unit, newUnit),
      dist: convertDist(s.dist, unit, newUnit),
      ...(s.intervalType === 'distance' ? {
        runInterval: convertDist(s.runInterval, unit, newUnit),
        walkInterval: convertDist(s.walkInterval, unit, newUnit),
      } : {}),
    })));

    setUnit(newUnit);
    setResults(null);
    setCalcError(null);
  };

  const addSegment = () => {
    setSegments(prev => [...prev, {
      id: Date.now(),
      dist: '10',
      runPace: runPace,
      walkPace: walkPace,
      intervalType: intervalType,
      runInterval: runInterval,
      walkInterval: walkInterval,
    }]);
  };

  const removeSegment = (id) => setSegments(prev => prev.filter(s => s.id !== id));

  const updateSegment = (id, updates) =>
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

  const getTotalKm = () => {
    if (distPreset === 'Custom') {
      const d = parseFloat(customDist);
      if (isNaN(d) || d <= 0) return null;
      return unit === 'km' ? d : d * MILES_TO_KM;
    }
    return PRESET_DISTANCES_KM[distPreset] ?? null;
  };

  const handleCalculate = () => {
    setCalcError(null);
    setResults(null);

    if (multiSeg) {
      const segParams = [];
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const dist = parseFloat(seg.dist);
        if (isNaN(dist) || dist <= 0) {
          setCalcError(`Segment ${i + 1}: enter a valid distance.`);
          return;
        }
        const distKm = unit === 'km' ? dist : dist * MILES_TO_KM;
        const segRunPaceMin = parseTimeToMinutes(seg.runPace);
        const segWalkPaceMin = parseTimeToMinutes(seg.walkPace);
        if (isNaN(segRunPaceMin) || segRunPaceMin <= 0) {
          setCalcError(`Segment ${i + 1}: invalid run pace.`);
          return;
        }
        if (isNaN(segWalkPaceMin) || segWalkPaceMin <= 0) {
          setCalcError(`Segment ${i + 1}: invalid walk pace.`);
          return;
        }
        const ri = parseFloat(seg.runInterval);
        const wi = parseFloat(seg.walkInterval);
        if (isNaN(ri) || ri <= 0 || isNaN(wi) || wi <= 0) {
          setCalcError(`Segment ${i + 1}: invalid intervals.`);
          return;
        }
        const riKm = seg.intervalType === 'distance' && unit === 'mi' ? ri * MILES_TO_KM : ri;
        const wiKm = seg.intervalType === 'distance' && unit === 'mi' ? wi * MILES_TO_KM : wi;
        segParams.push({
          distKm,
          runSpeedKm: paceToSpeedKm(segRunPaceMin, unit),
          walkSpeedKm: paceToSpeedKm(segWalkPaceMin, unit),
          intervalType: seg.intervalType,
          runInterval: riKm,
          walkInterval: wiKm,
        });
      }
      const res = calcMultiSegment(segParams);
      if (res.error) setCalcError(res.error);
      else setResults(res);
      return;
    }

    const totalKm = getTotalKm();
    if (!totalKm) { setCalcError('Please enter a valid race distance.'); return; }

    const walkPaceMin = parseTimeToMinutes(walkPace);
    if (isNaN(walkPaceMin) || walkPaceMin <= 0) {
      setCalcError('Invalid walk pace. Use MM:SS format, e.g. 10:00.');
      return;
    }
    const walkSpeedKm = paceToSpeedKm(walkPaceMin, unit);

    const ri = parseFloat(runInterval);
    const wi = parseFloat(walkInterval);
    if (isNaN(ri) || ri <= 0 || isNaN(wi) || wi <= 0) {
      setCalcError('Run and walk interval values must be positive numbers.');
      return;
    }
    const riKm = intervalType === 'distance' && unit === 'mi' ? ri * MILES_TO_KM : ri;
    const wiKm = intervalType === 'distance' && unit === 'mi' ? wi * MILES_TO_KM : wi;

    let res;
    if (mode === 'pace') {
      const goalMin = parseTimeToMinutes(goalTime);
      if (isNaN(goalMin) || goalMin <= 0) {
        setCalcError('Invalid goal time. Use H:MM:SS format, e.g. 4:00:00.');
        return;
      }
      res = calcRequiredRunPace({ totalKm, goalMin, walkSpeedKm, intervalType, runInterval: riKm, walkInterval: wiKm });
    } else {
      const runPaceMin = parseTimeToMinutes(runPace);
      if (isNaN(runPaceMin) || runPaceMin <= 0) {
        setCalcError('Invalid run pace. Use MM:SS format, e.g. 5:30.');
        return;
      }
      const runSpeedKm = paceToSpeedKm(runPaceMin, unit);
      res = calcFinishTime({ totalKm, runSpeedKm, walkSpeedKm, intervalType, runInterval: riKm, walkInterval: wiKm });
    }

    if (res.error) setCalcError(res.error);
    else setResults(res);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-800 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Jeffing Calculator</h1>
            <p className="text-slate-400 text-xs mt-0.5">Plan your run/walk intervals for any race</p>
          </div>

          <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
            {['km', 'mi'].map(u => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  unit === u ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <InputPanel
          unit={unit}
          mode={mode} setMode={m => { setMode(m); setResults(null); setCalcError(null); }}
          distPreset={distPreset} setDistPreset={p => { setDistPreset(p); setResults(null); }}
          customDist={customDist} setCustomDist={setCustomDist}
          goalTime={goalTime} setGoalTime={setGoalTime}
          runPace={runPace} setRunPace={setRunPace}
          walkPace={walkPace} setWalkPace={setWalkPace}
          intervalType={intervalType} setIntervalType={t => { setIntervalType(t); setResults(null); }}
          runInterval={runInterval} setRunInterval={setRunInterval}
          walkInterval={walkInterval} setWalkInterval={setWalkInterval}
          multiSeg={multiSeg} setMultiSeg={v => { setMultiSeg(v); setResults(null); setCalcError(null); }}
          segments={segments} addSegment={addSegment}
          removeSegment={removeSegment} updateSegment={updateSegment}
          onCalculate={handleCalculate}
          error={calcError}
        />

        {results && (
          <ResultsPanel results={results} unit={unit} mode={multiSeg ? 'time' : mode} />
        )}
      </main>

      <footer className="text-center py-8 text-slate-400 text-xs">
        Based on the Jeff Galloway run/walk method
      </footer>
    </div>
  );
}
