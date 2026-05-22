import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot,
} from 'recharts';
import { formatMinutes, speedToDisplayPace, PRESET_DISTANCES_KM, KM_TO_MILES } from '../utils/calculations';

function getSplitLabel(distKm, isFinish) {
  const eps = 0.05;
  if (Math.abs(distKm - 42.195) < eps) return 'Marathon';
  if (Math.abs(distKm - 21.0975) < eps) return 'Half Marathon';
  if (isFinish) {
    const preset = Object.entries(PRESET_DISTANCES_KM).find(([, v]) => Math.abs(v - distKm) < eps);
    return preset ? preset[0] : 'Finish';
  }
  if (Number.isInteger(distKm)) return `${distKm} km`;
  return `${distKm.toFixed(1)} km`;
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
      <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-indigo-700' : 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function yAxisFormatter(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}m`;
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const distLabel = unit === 'mi'
    ? `${(label * KM_TO_MILES).toFixed(2)} mi`
    : `${Number(label).toFixed(2)} km`;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-slate-500 text-xs">{distLabel}</p>
      <p className="font-bold text-slate-800">{formatMinutes(payload[0].value, true)}</p>
    </div>
  );
}

export default function ResultsPanel({ results, unit, mode }) {
  const { totalMin, runSpeedKm, walkSpeedKm, avgSpeedKm, runFraction, splits, chartPoints } = results;

  const distFn = km => unit === 'mi' ? km * KM_TO_MILES : km;

  const chartData = chartPoints.map(p => ({
    dist: parseFloat(distFn(p.distKm).toFixed(3)),
    time: parseFloat(p.timeMin.toFixed(3)),
  }));

  const splitDots = splits.map(s => ({
    x: parseFloat(distFn(s.distKm).toFixed(3)),
    y: parseFloat(s.timeMin.toFixed(3)),
    distKm: s.distKm,
    timeMin: s.timeMin,
  }));

  return (
    <div className="space-y-4">
      {/* Primary result */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
              {mode === 'pace' ? 'Required Run Pace' : 'Projected Finish Time'}
            </p>
            <p className="text-5xl font-bold text-indigo-600 leading-none">
              {mode === 'pace'
                ? speedToDisplayPace(runSpeedKm, unit)
                : formatMinutes(totalMin, true)}
            </p>
            {mode === 'pace' && (
              <p className="text-sm text-slate-500 mt-2">
                per {unit} &mdash; finish in <span className="font-semibold text-slate-700">{formatMinutes(totalMin, true)}</span>
              </p>
            )}
          </div>

          {/* Interval breakdown pill */}
          <div className="flex gap-2 text-xs">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-medium">
              {Math.round(runFraction * 100)}% running
            </span>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
              {Math.round((1 - runFraction) * 100)}% walking
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatCard
            label="Avg Pace"
            value={speedToDisplayPace(avgSpeedKm, unit)}
            sub={`per ${unit}`}
          />
          <StatCard
            label="Run Pace"
            value={speedToDisplayPace(runSpeedKm, unit)}
            sub={`per ${unit}`}
            highlight={mode === 'pace'}
          />
          <StatCard
            label="Walk Pace"
            value={speedToDisplayPace(walkSpeedKm, unit)}
            sub={`per ${unit}`}
          />
          <StatCard
            label="Finish Time"
            value={formatMinutes(totalMin, true)}
            highlight={mode === 'time'}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Cumulative Time</h3>
        <p className="text-xs text-slate-400 mb-4">How your time builds across the distance</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="dist"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={v => `${Number(v).toFixed(unit === 'mi' ? 1 : 0)}${unit}`}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={yAxisFormatter}
              width={50}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Line
              type="monotone"
              dataKey="time"
              stroke="#4f46e5"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#4f46e5' }}
            />
            {splitDots.map(d => (
              <ReferenceDot
                key={d.distKm}
                x={d.x}
                y={d.y}
                r={4}
                fill="#4f46e5"
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Splits table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Race Splits</h3>
        <p className="text-xs text-slate-400 mb-4">Projected time and average pace at each checkpoint</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-6 text-xs text-slate-400 font-semibold uppercase tracking-wide">Checkpoint</th>
                <th className="text-right py-2 pr-6 text-xs text-slate-400 font-semibold uppercase tracking-wide">Distance</th>
                <th className="text-right py-2 pr-6 text-xs text-slate-400 font-semibold uppercase tracking-wide">Time</th>
                <th className="text-right py-2 text-xs text-slate-400 font-semibold uppercase tracking-wide">Avg Pace</th>
              </tr>
            </thead>
            <tbody>
              {splits.map((s, i) => {
                const isFinish = i === splits.length - 1;
                const avgSpeed = s.distKm / s.timeMin;
                const distDisplay = unit === 'mi'
                  ? `${(s.distKm * KM_TO_MILES).toFixed(2)} mi`
                  : `${s.distKm % 1 === 0 ? s.distKm : s.distKm.toFixed(2)} km`;
                return (
                  <tr
                    key={s.distKm}
                    className={`border-b border-slate-50 ${isFinish ? 'font-semibold text-indigo-700' : 'text-slate-700'}`}
                  >
                    <td className="py-2.5 pr-6">{getSplitLabel(s.distKm, isFinish)}</td>
                    <td className="text-right py-2.5 pr-6 text-slate-500">{distDisplay}</td>
                    <td className="text-right py-2.5 pr-6">{formatMinutes(s.timeMin, totalMin >= 60)}</td>
                    <td className="text-right py-2.5 text-slate-500">
                      {speedToDisplayPace(avgSpeed, unit)}/{unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
