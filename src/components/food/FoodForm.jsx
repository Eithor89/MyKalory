import { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import { t } from '../../i18n/es.js';

const EMPTY = { name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '100' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = t.foods.validation.nameRequired;
  if (!form.calories || isNaN(form.calories) || Number(form.calories) < 0) errors.calories = t.foods.validation.numberPositive;
  if (form.protein && (isNaN(form.protein) || Number(form.protein) < 0)) errors.protein = t.foods.validation.numberPositive;
  if (form.carbs   && (isNaN(form.carbs)   || Number(form.carbs)   < 0)) errors.carbs   = t.foods.validation.numberPositive;
  if (form.fat     && (isNaN(form.fat)     || Number(form.fat)     < 0)) errors.fat     = t.foods.validation.numberPositive;
  return errors;
}

export default function FoodForm({ isOpen, onClose, onSave, food = null }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEditing = !!food?.id;

  useEffect(() => {
    if (isOpen) {
      setForm(
        food
          ? {
              name: food.name || '',
              calories: String(food.calories ?? ''),
              protein: String(food.protein ?? ''),
              carbs: String(food.carbs ?? ''),
              fat: String(food.fat ?? ''),
              servingSize: String(food.servingSize ?? 100),
            }
          : EMPTY
      );
      setErrors({});
    }
  }, [isOpen, food]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({
        ...(food || {}),
        name: form.name.trim(),
        calories: parseFloat(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        servingSize: parseFloat(form.servingSize) || 100,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t.foods.editFood : t.foods.addNew}
      footer={
        <>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>{t.foods.cancel}</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving} id="save-food-btn">
            {t.foods.save}
          </button>
        </>
      }
    >
      <div>
        <Field label={t.foods.name} error={errors.name}>
          <input id="food-name" className="input" type="text" placeholder={t.foods.namePlaceholder} value={form.name} onChange={set('name')} autoFocus />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
          <Field label={t.foods.calories} error={errors.calories}>
            <input id="food-calories" className="input" type="number" inputMode="decimal" min="0" placeholder="0" value={form.calories} onChange={set('calories')} />
          </Field>
          <Field label={t.foods.servingSize} error={errors.servingSize}>
            <input id="food-serving" className="input" type="number" inputMode="decimal" min="1" placeholder={t.foods.servingSizePlaceholder} value={form.servingSize} onChange={set('servingSize')} />
          </Field>
        </div>

        <div className="divider" />

        <p className="text-xs text-muted-2" style={{ marginBottom: 12 }}>Macros por 100g</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label={t.foods.protein} error={errors.protein}>
            <input id="food-protein" className="input" type="number" inputMode="decimal" min="0" placeholder="0" value={form.protein} onChange={set('protein')} />
          </Field>
          <Field label={t.foods.carbs} error={errors.carbs}>
            <input id="food-carbs" className="input" type="number" inputMode="decimal" min="0" placeholder="0" value={form.carbs} onChange={set('carbs')} />
          </Field>
          <Field label={t.foods.fat} error={errors.fat}>
            <input id="food-fat" className="input" type="number" inputMode="decimal" min="0" placeholder="0" value={form.fat} onChange={set('fat')} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {children}
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
