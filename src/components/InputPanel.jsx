import { PRESET_DISTANCES_KM } from '../utils/calculations';

const PRESETS = [...Object.keys(PRESET_DISTANCES_KM), 'Custom'];

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${className}`}
    />
  );
}

function NumberInput({ value, onChange, min, step, className = '' }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      min={min}
      step={step}
      className={`px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${className}`}
    />
  );
}

export default function InputPanel({
  unit,
  mode, setMode,
  distPreset, setDistPreset,
  customDist, setCustomDist,
  goalTime, setGoalTime,
  runPace, setRunPace,
  walkPace, setWalkPace,
  intervalType, setIntervalType,
  runInterval, setRunInterval,
  walkInterval, setWalkInterval,
  onCalculate,
  error,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 border-b border-slate-200">
        <button
          onClick={() => setMode('time')}
          className={`py-4 text-sm font-semibold transition-colors ${
            mode === 'time'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Find Finish Time
        </button>
        <button
          onClick={() => setMode('pace')}
          className={`py-4 text-sm font-semibold transition-colors border-l border-slate-200 ${
            mode === 'pace'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Find Run Pace
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Mode description */}
        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          {mode === 'time'
            ? 'Enter your run and walk paces plus your interval schedule to see your projected finish time.'
            : 'Enter your goal finish time and walk pace to find what run pace you need to hit it.'}
        </p>

        {/* Distance */}
        <Field label="Race Distance">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setDistPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  distPreset === p
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {distPreset === 'Custom' && (
            <div className="flex items-center gap-2 mt-3">
              <NumberInput
                value={customDist}
                onChange={setCustomDist}
                min="0.1"
                step="0.1"
                className="w-28"
              />
              <span className="text-sm text-slate-500">{unit}</span>
            </div>
          )}
        </Field>

        {/* Pace inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === 'pace' ? (
            <Field label="Goal Finish Time" hint="Format: H:MM:SS">
              <TextInput
                value={goalTime}
                onChange={setGoalTime}
                placeholder="e.g. 4:00:00"
                className="w-36"
              />
            </Field>
          ) : (
            <Field label={`Run Pace (per ${unit})`} hint="Format: MM:SS">
              <TextInput
                value={runPace}
                onChange={setRunPace}
                placeholder="e.g. 5:30"
                className="w-28"
              />
            </Field>
          )}

          <Field label={`Walk Pace (per ${unit})`} hint="Format: MM:SS">
            <TextInput
              value={walkPace}
              onChange={setWalkPace}
              placeholder="e.g. 10:00"
              className="w-28"
            />
          </Field>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Interval type */}
        <Field
          label="Interval Type"
          hint={
            intervalType === 'time'
              ? 'Run and walk for set time periods, e.g. run 4 min, walk 1 min.'
              : 'Run and walk for set distances, e.g. run 1 km, walk 100 m.'
          }
        >
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setIntervalType('time')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                intervalType === 'time'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              Time-based
            </button>
            <button
              onClick={() => setIntervalType('distance')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                intervalType === 'distance'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              Distance-based
            </button>
          </div>
        </Field>

        {/* Interval values */}
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Run ${intervalType === 'time' ? 'Duration' : 'Distance'}`}>
            <div className="flex items-center gap-2">
              <NumberInput
                value={runInterval}
                onChange={setRunInterval}
                min="0.01"
                step={intervalType === 'time' ? '0.5' : '0.1'}
                className="w-20"
              />
              <span className="text-sm text-slate-500">{intervalType === 'time' ? 'min' : unit}</span>
            </div>
          </Field>
          <Field label={`Walk ${intervalType === 'time' ? 'Duration' : 'Distance'}`}>
            <div className="flex items-center gap-2">
              <NumberInput
                value={walkInterval}
                onChange={setWalkInterval}
                min="0.01"
                step={intervalType === 'time' ? '0.5' : '0.1'}
                className="w-20"
              />
              <span className="text-sm text-slate-500">{intervalType === 'time' ? 'min' : unit}</span>
            </div>
          </Field>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Calculate */}
        <button
          onClick={onCalculate}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-colors text-sm tracking-wide"
        >
          Calculate
        </button>
      </div>
    </div>
  );
}
