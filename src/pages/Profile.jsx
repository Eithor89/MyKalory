import { useState, useEffect } from 'react';
import { useProfile, useAllLogs, useWeightLog, useAllExerciseLogs } from '../hooks/index.js';
import { calculateBMR, calculateTDEE, calculateTarget, estimatedWeeklyChange } from '../lib/calculations.js';
import { exportAllCSV, exportAllXLSX } from '../lib/export.js';
import { useToast } from '../components/ui/Toast.jsx';
import { t } from '../i18n/es.js';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',  label: t.profile.activityLevels.sedentary },
  { value: 'light',      label: t.profile.activityLevels.light },
  { value: 'moderate',   label: t.profile.activityLevels.moderate },
  { value: 'active',     label: t.profile.activityLevels.active },
  { value: 'veryActive', label: t.profile.activityLevels.veryActive },
];

const GOAL_OPTIONS = [
  { value: 'lose_moderate', label: t.profile.goals.lose_moderate },
  { value: 'lose_slow',     label: t.profile.goals.lose_slow },
  { value: 'maintain',      label: t.profile.goals.maintain },
  { value: 'gain_slow',     label: t.profile.goals.gain_slow },
  { value: 'gain_moderate', label: t.profile.goals.gain_moderate },
];

const EMPTY_FORM = {
  sex: 'male',
  age: '',
  height: '',
  weight: '',
  activityLevel: 'moderate',
  goal: 'maintain',
};

function validate(form) {
  const errs = {};
  const v = t.profile.validation;
  if (!form.age || isNaN(form.age) || form.age < 10 || form.age > 120) errs.age = v.ageRange;
  if (!form.height || isNaN(form.height) || form.height < 50 || form.height > 300) errs.height = v.heightRange;
  if (!form.weight || isNaN(form.weight) || form.weight < 20 || form.weight > 500) errs.weight = v.weightRange;
  return errs;
}

export default function Profile() {
  const { profile, loading, updateProfile } = useProfile();
  const { logs } = useAllLogs();
  const { entries: weightEntries } = useWeightLog();
  const { logs: exerciseLogs } = useAllExerciseLogs();
  const showToast = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (profile) {
        setForm({
          sex: profile.sex || 'male',
          age: String(profile.age || ''),
          height: String(profile.height || ''),
          weight: String(profile.weight || ''),
          activityLevel: profile.activityLevel || 'moderate',
          goal: profile.goal || 'maintain',
        });
      } else {
        setIsFirstRun(true);
      }
    }
  }, [profile, loading]);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  // Live computed metrics from form
  const liveProfile = {
    sex: form.sex,
    age: parseFloat(form.age) || 0,
    height: parseFloat(form.height) || 0,
    weight: parseFloat(form.weight) || 0,
    activityLevel: form.activityLevel,
    goal: form.goal,
  };
  const bmr   = Math.round(calculateBMR(liveProfile));
  const tdee  = calculateTDEE(bmr, form.activityLevel);
  const target = calculateTarget(tdee, form.goal);
  const change = estimatedWeeklyChange(form.goal);

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await updateProfile({
        sex: form.sex,
        age: parseFloat(form.age),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        activityLevel: form.activityLevel,
        goal: form.goal,
      });
      setIsFirstRun(false);
      setErrors({});
      showToast(t.profile.saved);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    exportAllCSV(logs, weightEntries);
    showToast(t.profile.exportSuccess);
  };

  const handleExportXLSX = () => {
    exportAllXLSX(logs, weightEntries, exerciseLogs);
    showToast(t.profile.exportSuccess);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-content" style={{ paddingTop: 'var(--space-8)' }}>
          <p className="text-muted text-sm">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (isFirstRun) {
    return (
      <div className="page">
        <div className="page-content">
          <div style={{ paddingTop: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>🥗</div>
            <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 8 }}>{t.profile.setupTitle}</h1>
            <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--font-sm)' }}>{t.profile.setupSubtitle}</p>
          </div>
          <ProfileForm form={form} set={set} errors={errors} />
          <MetricsCard bmr={bmr} tdee={tdee} target={target} change={change} goal={form.goal} />
          <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving} id="setup-save-btn" style={{ marginTop: 'var(--space-4)' }}>
            {t.profile.setupCTA}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content">
        <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, paddingTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {t.profile.title}
        </h1>

        <ProfileForm form={form} set={set} errors={errors} />

        {/* Live metrics */}
        <MetricsCard bmr={bmr} tdee={tdee} target={target} change={change} goal={form.goal} />

        <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving} id="profile-save-btn" style={{ marginBottom: 'var(--space-8)' }}>
          {t.profile.save}
        </button>

        {/* Export */}
        <div className="section">
          <p className="section-title">{t.profile.exportData}</p>
          <div className="card">
            <button className="list-item" style={{ width: '100%', justifyContent: 'space-between', background: 'none' }} onClick={handleExportCSV} id="export-csv-btn">
              <span className="font-medium text-sm">{t.profile.exportCSV}</span>
              <DownloadIcon />
            </button>
            <button className="list-item" style={{ width: '100%', justifyContent: 'space-between', background: 'none' }} onClick={handleExportXLSX} id="export-xlsx-btn">
              <span className="font-medium text-sm">{t.profile.exportExcel}</span>
              <DownloadIcon />
            </button>
          </div>
        </div>

        <div style={{ height: 'var(--space-6)' }} />
      </div>
    </div>
  );
}

function ProfileForm({ form, set, errors }) {
  return (
    <div className="section">
      <p className="section-title">{t.profile.personalData}</p>
      <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Sex */}
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">{t.profile.sex}</label>
          <div className="segment">
            <button className={`segment-item${form.sex === 'male' ? ' active' : ''}`} onClick={() => set('sex')({ target: { value: 'male' } })}>
              {t.profile.male}
            </button>
            <button className={`segment-item${form.sex === 'female' ? ' active' : ''}`} onClick={() => set('sex')({ target: { value: 'female' } })}>
              {t.profile.female}
            </button>
          </div>
        </div>

        {/* Age / Height / Weight row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">{t.profile.age} ({t.profile.ageUnit})</label>
            <input id="profile-age" className="input" type="number" inputMode="numeric" min="10" max="120" placeholder={t.profile.agePlaceholder} value={form.age} onChange={set('age')} />
            {errors.age && <span className="input-error">{errors.age}</span>}
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">{t.profile.height} ({t.profile.heightUnit})</label>
            <input id="profile-height" className="input" type="number" inputMode="numeric" min="50" max="300" placeholder={t.profile.heightPlaceholder} value={form.height} onChange={set('height')} />
            {errors.height && <span className="input-error">{errors.height}</span>}
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">{t.profile.weight} ({t.profile.weightUnit})</label>
            <input id="profile-weight" className="input" type="number" inputMode="decimal" step="0.1" min="20" max="500" placeholder={t.profile.weightPlaceholder} value={form.weight} onChange={set('weight')} />
            {errors.weight && <span className="input-error">{errors.weight}</span>}
          </div>
        </div>

        {/* Activity level */}
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">{t.profile.activityLevel}</label>
          <select id="profile-activity" className="select" value={form.activityLevel} onChange={set('activityLevel')}>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Goal */}
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">{t.profile.goal}</label>
          <select id="profile-goal" className="select" value={form.goal} onChange={set('goal')}>
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function MetricsCard({ bmr, tdee, target, change, goal }) {
  const noData = !bmr || !tdee;
  const goalAdj = goal === 'maintain' ? '' : `${change.sign}${change.kg} kg/sem`;

  return (
    <div className="section">
      <p className="section-title">{t.profile.metrics}</p>
      <div className="card">
        <MetricRow label={t.profile.bmr}   value={noData ? '–' : `${bmr} kcal/día`}    color="var(--color-text)" />
        <MetricRow label={t.profile.tdee}  value={noData ? '–' : `${tdee} kcal/día`}   color="var(--color-blue)" />
        <MetricRow label={t.profile.targetCalories} value={noData ? '–' : `${target} kcal/día`} color="var(--color-accent)" />
        {!noData && goalAdj && (
          <MetricRow label={t.profile.estimatedChange} value={goalAdj} color={goal.startsWith('lose') ? 'var(--color-green)' : 'var(--color-amber)'} />
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }) {
  return (
    <div className="list-item">
      <span className="text-sm" style={{ flex: 1 }}>{label}</span>
      <span className="font-semibold text-sm" style={{ color }}>{value}</span>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--color-text-3)' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
