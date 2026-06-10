import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useWeightLog } from '../hooks/index.js';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { movingAverage, weeklyTrend } from '../lib/trends.js';
import { t } from '../i18n/es.js';

const RANGES = [
  { label: t.weight.last30Days, days: 30 },
  { label: t.weight.last90Days, days: 90 },
  { label: t.weight.allTime,    days: null },
];

export default function Weight() {
  const { entries, latest, addEntry, removeEntry } = useWeightLog();
  const showToast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const range = RANGES[rangeIdx];

  // Filter entries by range
  const cutoff = range.days ? format(subDays(new Date(), range.days), 'yyyy-MM-dd') : null;
  const filtered = cutoff ? entries.filter((e) => e.date >= cutoff) : entries;

  // Moving average data
  const avgData = movingAverage(filtered, 7);

  // Chart data: merge weight + moving average
  const chartData = filtered.map((e, i) => ({
    date: e.date,
    dateLabel: format(new Date(e.date + 'T12:00:00'), 'd MMM', { locale: es }),
    weight: e.weight,
    avg: avgData[i]?.avg,
  }));

  // Trend
  const trend = weeklyTrend(entries, 14);
  const trendUp = trend > 0.05;
  const trendDown = trend < -0.05;

  const handleAdd = async ({ weight, notes, date }) => {
    await addEntry({ weight: parseFloat(weight), notes, date });
    setAddOpen(false);
    showToast('Peso registrado');
  };

  const handleDelete = async (id) => {
    await removeEntry(id);
    setConfirmDelete(null);
    showToast('Registro eliminado');
  };

  const weightChange = entries.length >= 2
    ? (entries[entries.length - 1].weight - entries[0].weight).toFixed(1)
    : null;

  return (
    <div className="page">
      <div className="page-content">
        <div style={{ marginBottom: 'var(--space-5)', paddingTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>{t.weight.title}</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)} id="add-weight-btn">
            + {t.weight.addEntry}
          </button>
        </div>

        {/* Summary cards */}
        <div className="stat-grid section">
          <div className="stat-card">
            <span className="stat-label">{t.weight.currentWeight}</span>
            <span className="stat-value" style={{ color: 'var(--color-accent)' }}>
              {latest?.weight ?? '–'}
            </span>
            <span className="text-xs text-muted-2">{t.weight.kg}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t.weight.weeklyTrend}</span>
            <span className="stat-value" style={{ color: trendUp ? 'var(--color-amber)' : trendDown ? 'var(--color-green)' : 'var(--color-text-2)' }}>
              {trendUp ? '↑' : trendDown ? '↓' : '→'} {Math.abs(trend).toFixed(2)}
            </span>
            <span className="text-xs text-muted-2">kg{t.weight.perWeek ?? '/sem'}</span>
          </div>
        </div>

        {weightChange !== null && (
          <div style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: weightChange < 0 ? 'var(--color-green-dim)' : weightChange > 0 ? 'var(--color-amber-dim)' : 'var(--color-surface-2)', fontSize: 'var(--font-sm)' }}>
            Cambio total: <strong style={{ color: weightChange < 0 ? 'var(--color-green)' : 'var(--color-amber)' }}>{weightChange > 0 ? '+' : ''}{weightChange} kg</strong>
          </div>
        )}

        {/* Range selector */}
        <div className="segment section">
          {RANGES.map((r, i) => (
            <button key={r.label} className={`segment-item${rangeIdx === i ? ' active' : ''}`} onClick={() => setRangeIdx(i)}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="card card-padded section">
          <p className="text-sm font-semibold" style={{ marginBottom: 'var(--space-4)' }}>{t.weight.chartTitle}</p>
          {chartData.length < 2 ? (
            <div className="empty-state">
              <span className="empty-state-icon">⚖️</span>
              <span className="text-sm">{t.weight.noData}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: 'var(--color-text-2)', marginBottom: 4 }}
                  formatter={(v, name) => [
                    `${v} kg`,
                    name === 'weight' ? t.weight.actual : t.weight.movingAvg,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-accent)', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="weight"
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--color-text-3)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="avg"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* History list */}
        <div className="section">
          <p className="section-title">{t.weight.history}</p>
          {entries.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <span className="text-sm">{t.weight.noData}</span>
              </div>
            </div>
          ) : (
            <div className="card">
              {[...entries].reverse().slice(0, 30).map((entry) => (
                <div key={entry.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div className="font-medium text-sm">
                      {format(new Date(entry.date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                    </div>
                    {entry.notes && (
                      <div className="text-xs text-muted-2" style={{ marginTop: 2 }}>{entry.notes}</div>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)', marginRight: 8 }}>
                    {entry.weight} kg
                  </span>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirmDelete(entry.id)} aria-label="Eliminar">
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add weight modal */}
      <AddWeightModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} />

      {confirmDelete && (
        <ConfirmDelete
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function AddWeightModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ weight: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.weight || isNaN(form.weight) || Number(form.weight) <= 0) {
      setError('Introduce un peso válido.');
      return;
    }
    onSave(form);
    setForm({ weight: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.weight.addEntry}
      footer={
        <>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>{t.weight.cancel}</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} id="save-weight-btn">{t.weight.save}</button>
        </>
      }
    >
      <div>
        <div className="input-group">
          <label className="input-label">Fecha</label>
          <input className="input" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} max={format(new Date(), 'yyyy-MM-dd')} />
        </div>
        <div className="input-group">
          <label className="input-label">{t.weight.todayWeight}</label>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            placeholder={t.weight.weightPlaceholder}
            value={form.weight}
            onChange={(e) => { setForm((p) => ({ ...p, weight: e.target.value })); setError(''); }}
            autoFocus
            step="0.1"
            min="20"
            max="500"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            id="weight-value-input"
          />
          {error && <span className="input-error">{error}</span>}
        </div>
        <div className="input-group">
          <label className="input-label">{t.weight.notes}</label>
          <input className="input" type="text" placeholder="Opcional..." value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </div>
    </Modal>
  );
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <Modal isOpen onClose={onCancel} title="Confirmar">
      <p style={{ marginBottom: 'var(--space-5)', color: 'var(--color-text-2)' }}>{t.weight.deleteConfirm}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>{t.common.cancel}</button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} id="confirm-delete-weight-btn">{t.common.delete}</button>
      </div>
    </Modal>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
