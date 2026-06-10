import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProfile, useFoodLog, useExerciseLog, useFoods } from '../hooks/index.js';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import FoodSearch from '../components/food/FoodSearch.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { t } from '../i18n/es.js';

const today = format(new Date(), 'yyyy-MM-dd');

const MEALS = [
  { id: 'breakfast', label: t.dashboard.meals.breakfast, icon: '🌅' },
  { id: 'lunch',     label: t.dashboard.meals.lunch,     icon: '☀️' },
  { id: 'snack',     label: t.dashboard.meals.snack,     icon: '🍎' },
  { id: 'dinner',    label: t.dashboard.meals.dinner,    icon: '🌙' },
];

export default function Dashboard() {
  const { metrics } = useProfile();
  const { byMeal, totals, addEntry, removeEntry, copyFromYesterday } = useFoodLog(today);
  const { entries: exercises, totalBurned, addEntry: addExercise, removeEntry: removeExercise } = useExerciseLog(today);
  const { foods, favorites, recent, createFood } = useFoods();

  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState(null);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const showToast = useToast();

  const target = metrics?.target || 0;
  const macroTargets = metrics?.macros || { protein: 0, carbs: 0, fat: 0 };
  const remaining = Math.max(0, target - totals.calories + totalBurned);

  const openFoodSearch = (meal) => {
    setActiveMeal(meal);
    setSearchOpen(true);
  };

  const handleAddFood = async (entry) => {
    await addEntry(entry);
    showToast(t.log.logged);
  };

  const handleDeleteEntry = async (id) => {
    await removeEntry(id);
    setConfirmDelete(null);
  };

  const handleCopyYesterday = async (meal) => {
    const count = await copyFromYesterday(meal);
    showToast(count > 0 ? t.dashboard.copiedSuccess : t.dashboard.noMealYesterday);
  };

  return (
    <div className="page">
      <div className="page-content">
        {/* Date header */}
        <div style={{ marginBottom: 'var(--space-5)', paddingTop: 'var(--space-2)' }}>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>{t.dashboard.today}</h1>
          <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--font-sm)', textTransform: 'capitalize' }}>
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>

        {/* Calorie ring card */}
        <div className="card card-padded section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            {/* Big ring */}
            <CalorieRing consumed={totals.calories} target={target + totalBurned} />

            {/* Right side stats */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <StatRow label={t.dashboard.goal}      value={target + totalBurned} unit="kcal" />
              <StatRow label={t.dashboard.consumed}  value={totals.calories}      unit="kcal" color="var(--color-accent)" />
              {totalBurned > 0 && (
                <StatRow label={t.dashboard.burned} value={totalBurned} unit="kcal" color="var(--color-green)" />
              )}
              <StatRow
                label={t.dashboard.remaining}
                value={remaining}
                unit="kcal"
                color={remaining <= 0 ? 'var(--color-red)' : 'var(--color-text)'}
              />
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="card section" style={{ padding: 'var(--space-4)' }}>
          <MacroBar
            label={t.dashboard.protein}
            value={totals.protein}
            target={macroTargets.protein}
            unit="g"
            color="var(--color-protein)"
          />
          <div style={{ height: 12 }} />
          <MacroBar
            label={t.dashboard.carbs}
            value={totals.carbs}
            target={macroTargets.carbs}
            unit="g"
            color="var(--color-carbs)"
          />
          <div style={{ height: 12 }} />
          <MacroBar
            label={t.dashboard.fat}
            value={totals.fat}
            target={macroTargets.fat}
            unit="g"
            color="var(--color-fat)"
          />
        </div>

        {/* Meal sections */}
        {MEALS.map(({ id, label, icon }) => (
          <MealSection
            key={id}
            id={id}
            label={label}
            icon={icon}
            entries={byMeal[id] || []}
            onAdd={() => openFoodSearch(id)}
            onDelete={(entryId) => setConfirmDelete(entryId)}
            onCopyYesterday={() => handleCopyYesterday(id)}
          />
        ))}

        {/* Exercise section */}
        <ExerciseSection
          entries={exercises}
          totalBurned={totalBurned}
          onAdd={() => setExerciseOpen(true)}
          onDelete={async (id) => { await removeExercise(id); }}
        />

        <div style={{ height: 'var(--space-6)' }} />
      </div>

      {/* Food search modal */}
      <FoodSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={handleAddFood}
        onCreateFood={createFood}
        foods={foods}
        favorites={favorites}
        recent={recent}
        meal={activeMeal}
      />

      {/* Exercise modal */}
      <ExerciseModal
        isOpen={exerciseOpen}
        onClose={() => setExerciseOpen(false)}
        onSave={async (entry) => { await addExercise(entry); setExerciseOpen(false); }}
      />

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmModal
          message={t.log.deleteConfirm}
          onConfirm={() => handleDeleteEntry(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CalorieRing({ consumed, target }) {
  const size = 110;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver = target > 0 && consumed > target;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={isOver ? 'var(--color-red)' : 'var(--color-accent)'}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, lineHeight: 1 }}>{consumed}</span>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-3)' }}>kcal</span>
      </div>
    </div>
  );
}

function StatRow({ label, value, unit, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-2)' }}>{label}</span>
      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: color || 'var(--color-text)' }}>
        {value} <span style={{ fontWeight: 400, color: 'var(--color-text-3)', fontSize: 'var(--font-xs)' }}>{unit}</span>
      </span>
    </div>
  );
}

function MacroBar({ label, value, target, unit, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-2)' }}>
          <span style={{ fontWeight: 600, color }}>{value}{unit}</span>
          <span style={{ color: 'var(--color-text-3)' }}> / {target}{unit}</span>
        </span>
      </div>
      <ProgressBar value={value} max={target} color={color} />
    </div>
  );
}

function MealSection({ id, label, icon, entries, onAdd, onDelete, onCopyYesterday }) {
  const mealTotal = entries.reduce((s, e) => s + e.calories, 0);
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="section">
      {/* Meal header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'var(--space-3)', cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>{icon}</span>
          <span style={{ fontWeight: 600 }}>{label}</span>
          {mealTotal > 0 && (
            <span className="badge badge-accent">{mealTotal} kcal</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={(e) => { e.stopPropagation(); onCopyYesterday(); }}
            title="Copiar de ayer"
            style={{ color: 'var(--color-text-3)' }}
          >
            <CopyIcon />
          </button>
          <button
            className="btn btn-primary btn-sm btn-icon"
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            id={`add-${id}-btn`}
            aria-label={`Añadir a ${label}`}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Entries */}
      {expanded && (
        <div className="card animate-in">
          {entries.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 'var(--font-sm)' }}>
              {t.dashboard.noEntries}
            </div>
          ) : (
            entries.map((entry) => (
              <LogEntry key={entry.id} entry={entry} onDelete={() => onDelete(entry.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function LogEntry({ entry, onDelete }) {
  return (
    <div className="list-item">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="font-medium text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
            {entry.foodName}
          </span>
          <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-accent)', flexShrink: 0 }}>
            {entry.calories} kcal
          </span>
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-3)', marginTop: 2 }}>
          {entry.quantity}g · P:{entry.protein}g C:{entry.carbs}g G:{entry.fat}g
        </div>
      </div>
      <button
        className="btn btn-danger btn-sm btn-icon"
        onClick={onDelete}
        style={{ marginLeft: 8, flexShrink: 0 }}
        aria-label="Eliminar"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

function ExerciseSection({ entries, totalBurned, onAdd, onDelete }) {
  return (
    <div className="section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>🏃</span>
          <span style={{ fontWeight: 600 }}>{t.exercise.title}</span>
          {totalBurned > 0 && (
            <span className="badge badge-green">+{totalBurned} kcal</span>
          )}
        </div>
        <button className="btn btn-primary btn-sm btn-icon" onClick={onAdd} id="add-exercise-btn" aria-label="Añadir ejercicio">
          <PlusIcon />
        </button>
      </div>
      <div className="card">
        {entries.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 'var(--font-sm)' }}>
            {t.exercise.noActivities}
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="list-item">
              <div style={{ flex: 1 }}>
                <span className="font-medium text-sm">{e.name}</span>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-3)' }}>
                  {e.duration} min · +{e.caloriesBurned} kcal
                </div>
              </div>
              <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(e.id)} aria-label="Eliminar">
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExerciseModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', duration: '', caloriesBurned: '' });
  const [errors, setErrors] = useState({});

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t.exercise.validation.nameRequired;
    if (!form.duration || isNaN(form.duration) || Number(form.duration) <= 0) errs.duration = t.exercise.validation.durationRequired;
    if (!form.caloriesBurned || isNaN(form.caloriesBurned) || Number(form.caloriesBurned) <= 0) errs.caloriesBurned = t.exercise.validation.caloriesRequired;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    await onSave({ name: form.name.trim(), duration: Number(form.duration), caloriesBurned: Number(form.caloriesBurned) });
    setForm({ name: '', duration: '', caloriesBurned: '' });
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.exercise.addActivity}
      footer={
        <>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>{t.exercise.cancel}</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} id="save-exercise-btn">{t.exercise.save}</button>
        </>
      }
    >
      <div>
        <div className="input-group">
          <label className="input-label">{t.exercise.activityName}</label>
          <input id="exercise-name" className="input" placeholder={t.exercise.activityPlaceholder} value={form.name} onChange={set('name')} />
          {errors.name && <span className="input-error">{errors.name}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group">
            <label className="input-label">{t.exercise.duration}</label>
            <input id="exercise-duration" className="input" type="number" inputMode="numeric" min="1" placeholder="30" value={form.duration} onChange={set('duration')} />
            {errors.duration && <span className="input-error">{errors.duration}</span>}
          </div>
          <div className="input-group">
            <label className="input-label">{t.exercise.caloriesBurned}</label>
            <input id="exercise-calories" className="input" type="number" inputMode="numeric" min="1" placeholder="200" value={form.caloriesBurned} onChange={set('caloriesBurned')} />
            {errors.caloriesBurned && <span className="input-error">{errors.caloriesBurned}</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <Modal isOpen onClose={onCancel} title="Confirmar">
      <p style={{ marginBottom: 'var(--space-5)', color: 'var(--color-text-2)' }}>{message}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>{t.common.cancel}</button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} id="confirm-delete-btn">{t.common.delete}</button>
      </div>
    </Modal>
  );
}

// Icons
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
