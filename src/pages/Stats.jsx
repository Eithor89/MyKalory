import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { useProfile, useAllLogs, useWeightLog, useAllExerciseLogs } from '../hooks/index.js';
import { groupByDate, average, cumulativeBalance, goalAdherence, movingAverage } from '../lib/trends.js';
import { t } from '../i18n/es.js';

export default function Stats() {
  const { metrics } = useProfile();
  const { logs } = useAllLogs();
  const { entries: weightEntries } = useWeightLog();
  const { logs: exerciseLogs } = useAllExerciseLogs();

  const target = metrics?.target || 0;

  // ── Calorie data by date ──────────────────────────────────────────────────
  const calByDate = useMemo(() => groupByDate(logs), [logs]);

  // ── Exercise calories by date ─────────────────────────────────────────────
  const exByDate = useMemo(() => {
    const m = new Map();
    for (const e of exerciseLogs) {
      m.set(e.date, (m.get(e.date) || 0) + e.caloriesBurned);
    }
    return m;
  }, [exerciseLogs]);

  // ── Last 30 days bar chart ────────────────────────────────────────────────
  const last30 = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const cal = calByDate.get(d) || 0;
      const burned = exByDate.get(d) || 0;
      days.push({
        date: d,
        label: format(new Date(d + 'T12:00:00'), 'd MMM', { locale: es }),
        calories: cal,
        net: cal - burned,
      });
    }
    return days;
  }, [calByDate, exByDate]);

  // ── Weekly average (last 7 logged days) ──────────────────────────────────
  const weeklyAvg = useMemo(() => {
    const vals = [...calByDate.values()].filter(Boolean);
    const recent7 = vals.slice(-7);
    return average(recent7);
  }, [calByDate]);

  // ── Monthly average ───────────────────────────────────────────────────────
  const monthlyAvg = useMemo(() => {
    const cutoff = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const vals = [...calByDate.entries()]
      .filter(([d]) => d >= cutoff)
      .map(([, v]) => v);
    return average(vals);
  }, [calByDate]);

  // ── Cumulative balance chart ──────────────────────────────────────────────
  const balanceData = useMemo(() => {
    if (!target) return [];
    const sorted = [...calByDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const dailyTotals = sorted.map(([date, calories]) => ({ date, calories }));
    return cumulativeBalance(dailyTotals, target).map((d) => ({
      ...d,
      label: format(new Date(d.date + 'T12:00:00'), 'd MMM', { locale: es }),
    }));
  }, [calByDate, target]);

  // ── Goal adherence ────────────────────────────────────────────────────────
  const adherence = useMemo(() => {
    if (!target) return null;
    return goalAdherence([...calByDate.values()], target);
  }, [calByDate, target]);

  // ── Weight chart (last 90 days + moving avg) ──────────────────────────────
  const weightChartData = useMemo(() => {
    const cutoff = format(subDays(new Date(), 90), 'yyyy-MM-dd');
    const filtered = weightEntries.filter((e) => e.date >= cutoff);
    const avgData = movingAverage(filtered, 7);
    return filtered.map((e, i) => ({
      date: e.date,
      label: format(new Date(e.date + 'T12:00:00'), 'd MMM', { locale: es }),
      weight: e.weight,
      avg: avgData[i]?.avg,
    }));
  }, [weightEntries]);

  if (!logs.length && !weightEntries.length) {
    return (
      <div className="page">
        <div className="page-content">
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, paddingTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
            {t.stats.title}
          </h1>
          <div className="empty-state" style={{ marginTop: 60 }}>
            <span className="empty-state-icon">📊</span>
            <span className="text-sm">{t.stats.noData}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content">
        <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, paddingTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {t.stats.title}
        </h1>

        {/* Summary stats */}
        <div className="stat-grid section">
          <div className="stat-card">
            <span className="stat-label">{t.stats.thisWeek}</span>
            <span className="stat-value" style={{ color: 'var(--color-accent)' }}>{weeklyAvg}</span>
            <span className="text-xs text-muted-2">{t.stats.average} kcal</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t.stats.thisMonth}</span>
            <span className="stat-value" style={{ color: 'var(--color-blue)' }}>{monthlyAvg}</span>
            <span className="text-xs text-muted-2">{t.stats.average} kcal</span>
          </div>
          {target > 0 && adherence && (
            <>
              <div className="stat-card">
                <span className="stat-label">{t.stats.goalAdherence}</span>
                <span className="stat-value" style={{ color: adherence.percentage >= 70 ? 'var(--color-green)' : 'var(--color-amber)' }}>
                  {adherence.percentage}%
                </span>
                <span className="text-xs text-muted-2">{t.stats.daysOnTarget}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Días registrados</span>
                <span className="stat-value">{adherence.total}</span>
                <span className="text-xs text-muted-2">en total</span>
              </div>
            </>
          )}
        </div>

        {/* Calorie bar chart - last 30 days */}
        {last30.some((d) => d.calories > 0) && (
          <div className="card card-padded section">
            <p className="text-sm font-semibold" style={{ marginBottom: 'var(--space-4)' }}>
              Calorías — últimos 30 días
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last30} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v} kcal`, 'Calorías']}
                />
                {target > 0 && (
                  <ReferenceLine y={target} stroke="var(--color-accent)" strokeDasharray="4 4" strokeWidth={1.5} />
                )}
                <Bar dataKey="calories" radius={[3, 3, 0, 0]}>
                  {last30.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.calories === 0
                          ? 'var(--color-surface-3)'
                          : entry.calories > target && target > 0
                          ? 'var(--color-red)'
                          : 'var(--color-accent)'
                      }
                      fillOpacity={entry.calories === 0 ? 0.3 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {target > 0 && (
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-3)', marginTop: 8, textAlign: 'center' }}>
                Línea punteada = objetivo ({target} kcal)
              </p>
            )}
          </div>
        )}

        {/* Cumulative balance */}
        {balanceData.length >= 2 && target > 0 && (
          <div className="card card-padded section">
            <p className="text-sm font-semibold" style={{ marginBottom: 'var(--space-4)' }}>
              {t.stats.energyBalance}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={balanceData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v > 0 ? '+' : ''}${v} kcal`, 'Balance acumulado']}
                />
                <ReferenceLine y={0} stroke="var(--color-border-hover)" />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-blue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weight evolution */}
        {weightChartData.length >= 2 && (
          <div className="card card-padded section">
            <p className="text-sm font-semibold" style={{ marginBottom: 'var(--space-4)' }}>
              {t.stats.weightEvolution}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, name) => [`${v} kg`, name === 'weight' ? 'Peso' : 'Media móvil']}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-accent)' }} />
                <Line type="monotone" dataKey="avg" stroke="var(--color-text-3)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
