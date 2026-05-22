import { useState } from 'react';
import {
  PRESET_DISTANCES_KM, MILES_TO_KM, KM_TO_MILES,
  parseTimeToMinutes, formatMinutes,
  paceToSpeedKm, calcRequiredRunPace, calcFinishTime,
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
  const [results, setResults] = useState(null);
  const [calcError, setCalcError] = useState(null);

  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;
    setRunPace(convertPaceStr(runPace, unit, newUnit));
    setWalkPace(convertPaceStr(walkPace, unit, newUnit));

    if (customDist) {
      const d = parseFloat(customDist);
      if (!isNaN(d) && d > 0) {
        const factor = unit === 'km' ? KM_TO_MILES : MILES_TO_KM;
        setCustomDist((d * factor).toFixed(2));
      }
    }

    if (intervalType === 'distance') {
      const ri = parseFloat(runInterval);
      const wi = parseFloat(walkInterval);
      const factor = unit === 'km' ? KM_TO_MILES : MILES_TO_KM;
      if (!isNaN(ri) && ri > 0) setRunInterval((ri * factor).toFixed(3));
      if (!isNaN(wi) && wi > 0) setWalkInterval((wi * factor).toFixed(3));
    }

    setUnit(newUnit);
    setResults(null);
    setCalcError(null);
  };

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

    const totalKm = getTotalKm();
    if (!totalKm) {
      setCalcError('Please enter a valid race distance.');
      return;
    }

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

    // Convert distance intervals to km if needed
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

    if (res.error) {
      setCalcError(res.error);
    } else {
      setResults(res);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Jeffing Calculator</h1>
            <p className="text-indigo-200 text-xs mt-0.5">Plan your run/walk intervals for any race</p>
          </div>

          {/* Unit toggle */}
          <div className="flex bg-indigo-700 rounded-lg p-1 gap-1">
            {['km', 'mi'].map(u => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  unit === u
                    ? 'bg-white text-indigo-700'
                    : 'text-indigo-300 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
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
          onCalculate={handleCalculate}
          error={calcError}
        />

        {results && (
          <ResultsPanel
            results={results}
            unit={unit}
            mode={mode}
          />
        )}
      </main>

      <footer className="text-center py-8 text-slate-400 text-xs">
        Based on the Galloway run/walk method
      </footer>
    </div>
  );
}
