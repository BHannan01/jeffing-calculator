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
      className={`px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${className}`}
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
      className={`px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${className}`}
    />
  );
}

function SegmentCard({ seg, index, unit, onUpdate, onRemove, canRemove }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Segment {index + 1}</span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 w-16 shrink-0">Distance</label>
        <NumberInput value={seg.dist} onChange={v => onUpdate({ dist: v })} min="0.1" step="0.1" className="w-20" />
        <span className="text-xs text-slate-500">{unit}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Run Pace /{unit}</label>
          <TextInput value={seg.runPace} onChange={v => onUpdate({ runPace: v })} placeholder="5:30" className="w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Walk Pace /{unit}</label>
          <TextInput value={seg.walkPace} onChange={v => onUpdate({ walkPace: v })} placeholder="10:00" className="w-full" />
        </div>
      </div>

      <div className="flex gap-2">
        {['time', 'distance'].map(t => (
          <button
            key={t}
            onClick={() => onUpdate({ intervalType: t })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              seg.intervalType === t
                ? 'bg-slate-500 text-white border-slate-500'
                : 'text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            {t === 'time' ? 'Time' : 'Distance'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Run ({seg.intervalType === 'time' ? 'min' : unit})</label>
          <NumberInput value={seg.runInterval} onChange={v => onUpdate({ runInterval: v })} min="0.01" step={seg.intervalType === 'time' ? '0.5' : '0.1'} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Walk ({seg.intervalType === 'time' ? 'min' : unit})</label>
          <NumberInput value={seg.walkInterval} onChange={v => onUpdate({ walkInterval: v })} min="0.01" step={seg.intervalType === 'time' ? '0.5' : '0.1'} className="w-full" />
        </div>
      </div>
    </div>
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
  multiSeg, setMultiSeg,
  segments, addSegment, removeSegment, updateSegment,
  onCalculate,
  error,
}) {
  const totalSegDist = segments.reduce((sum, s) => {
    const d = parseFloat(s.dist);
    return sum + (isNaN(d) ? 0 : d);
  }, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 border-b border-slate-200">
        {[
          { id: 'time', label: 'Find Finish Time' },
          { id: 'pace', label: 'Find Run Pace' },
        ].map(({ id, label }, i) => (
          <button
            key={id}
            onClick={() => { if (!multiSeg) setMode(id); }}
            className={`py-4 text-sm font-semibold transition-colors ${i > 0 ? 'border-l border-slate-200' : ''} ${
              !multiSeg && mode === id
                ? 'bg-slate-500 text-white'
                : multiSeg
                ? 'text-slate-300 cursor-default'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {!multiSeg ? (
          <>
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              {mode === 'time'
                ? 'Enter your run and walk paces plus your interval schedule to see your projected finish time.'
                : 'Enter your goal finish time and walk pace to find what run pace you need to hit it.'}
            </p>

            <Field label="Race Distance">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setDistPreset(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      distPreset === p
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {distPreset === 'Custom' && (
                <div className="flex items-center gap-2 mt-3">
                  <NumberInput value={customDist} onChange={setCustomDist} min="0.1" step="0.1" className="w-28" />
                  <span className="text-sm text-slate-500">{unit}</span>
                </div>
              )}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mode === 'pace' ? (
                <Field label="Goal Finish Time" hint="Format: H:MM:SS">
                  <TextInput value={goalTime} onChange={setGoalTime} placeholder="e.g. 4:00:00" className="w-36" />
                </Field>
              ) : (
                <Field label={`Run Pace (per ${unit})`} hint="Format: MM:SS">
                  <TextInput value={runPace} onChange={setRunPace} placeholder="e.g. 5:30" className="w-28" />
                </Field>
              )}
              <Field label={`Walk Pace (per ${unit})`} hint="Format: MM:SS">
                <TextInput value={walkPace} onChange={setWalkPace} placeholder="e.g. 10:00" className="w-28" />
              </Field>
            </div>

            <div className="border-t border-slate-100" />

            <Field
              label="Interval Type"
              hint={intervalType === 'time'
                ? 'Run and walk for set time periods, e.g. run 4 min, walk 1 min.'
                : 'Run and walk for set distances, e.g. run 1 km, walk 100 m.'}
            >
              <div className="flex gap-2 mt-1">
                {[['time', 'Time-based'], ['distance', 'Distance-based']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setIntervalType(val)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      intervalType === val
                        ? 'bg-slate-500 text-white border-slate-500'
                        : 'text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={`Run ${intervalType === 'time' ? 'Duration' : 'Distance'}`}>
                <div className="flex items-center gap-2">
                  <NumberInput value={runInterval} onChange={setRunInterval} min="0.01" step={intervalType === 'time' ? '0.5' : '0.1'} className="w-20" />
                  <span className="text-sm text-slate-500">{intervalType === 'time' ? 'min' : unit}</span>
                </div>
              </Field>
              <Field label={`Walk ${intervalType === 'time' ? 'Duration' : 'Distance'}`}>
                <div className="flex items-center gap-2">
                  <NumberInput value={walkInterval} onChange={setWalkInterval} min="0.01" step={intervalType === 'time' ? '0.5' : '0.1'} className="w-20" />
                  <span className="text-sm text-slate-500">{intervalType === 'time' ? 'min' : unit}</span>
                </div>
              </Field>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              Define each segment with its own jeffing pace and intervals. Segments run in order.
            </p>
            {segments.map((seg, i) => (
              <SegmentCard
                key={seg.id}
                seg={seg}
                index={i}
                unit={unit}
                onUpdate={updates => updateSegment(seg.id, updates)}
                onRemove={() => removeSegment(seg.id)}
                canRemove={segments.length > 1}
              />
            ))}
            <button
              onClick={addSegment}
              className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
            >
              + Add Segment
            </button>
            <p className="text-xs text-right text-slate-400">
              Total: <span className="font-medium text-slate-600">{totalSegDist.toFixed(2)} {unit}</span>
            </p>
          </div>
        )}

        <div className="border-t border-slate-100" />

        {/* Custom race plan toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Custom Race Plan</p>
            <p className="text-xs text-slate-400 mt-0.5">Different jeffing intervals per race segment</p>
          </div>
          <button
            onClick={() => setMultiSeg(!multiSeg)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              multiSeg ? 'bg-slate-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                multiSeg ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={onCalculate}
          className="w-full py-3.5 bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white font-semibold rounded-xl transition-colors text-sm tracking-wide"
        >
          Calculate
        </button>
      </div>
    </div>
  );
}
