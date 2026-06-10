import { useState, useMemo, useRef, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import FoodForm from './FoodForm.jsx';
import { t } from '../../i18n/es.js';
import { scaleMacros } from '../../lib/calculations.js';

const TABS = [
  { id: 'recent',    label: t.log.recentFoods },
  { id: 'favorites', label: t.log.favoriteFoods },
  { id: 'all',       label: t.log.allFoods },
];

/**
 * FoodSearch — 2-step flow:
 *   Step 1: Pick a food (search + tabs)
 *   Step 2: Enter quantity and confirm
 */
export default function FoodSearch({ isOpen, onClose, onAdd, onCreateFood, foods, favorites, recent, meal }) {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('recent');
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const searchRef = useRef(null);
  const quantityRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setQuery('');
      setTab('recent');
      setSelectedFood(null);
      setQuantity('');
      setError('');
      setCreateOpen(false);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Focus quantity input on step 2
  useEffect(() => {
    if (step === 2 && selectedFood) {
      const defaultQty = selectedFood.servingSize || 100;
      setQuantity(String(defaultQty));
      setTimeout(() => {
        quantityRef.current?.focus();
        quantityRef.current?.select();
      }, 100);
    }
  }, [step, selectedFood]);

  // Filter foods by query and tab
  const displayedFoods = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = tab === 'recent'    ? recent
             : tab === 'favorites' ? favorites
             : foods;
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));
    return list;
  }, [query, tab, foods, favorites, recent]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setStep(2);
    setError('');
  };

  const handleCreateSave = async (newFood) => {
    if (onCreateFood) {
      const saved = await onCreateFood(newFood);
      handleSelectFood(saved);
    }
    setCreateOpen(false);
  };

  const handleAdd = () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setError('Introduce una cantidad válida.');
      return;
    }
    const macros = scaleMacros(selectedFood, qty);
    onAdd({
      meal,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantity: qty,
      ...macros,
    });
    onClose();
  };

  // Computed preview for step 2
  const preview = selectedFood && quantity && parseFloat(quantity) > 0
    ? scaleMacros(selectedFood, parseFloat(quantity))
    : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={step === 1 ? t.log.searchPlaceholder.replace('...', '') : selectedFood?.name}
        size="large"
      >
      {step === 1 ? (
        <div>
          {/* Search bar */}
          <div className="search-bar" style={{ marginBottom: 'var(--space-4)' }}>
            <span className="search-bar-icon">
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              className="input"
              type="search"
              placeholder={t.log.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              id="food-search-input"
            />
          </div>

          {/* Tabs */}
          <div className="segment" style={{ marginBottom: 'var(--space-4)' }}>
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                className={`segment-item${tab === id ? ' active' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Create new food button */}
          <button
            className="btn btn-ghost btn-sm btn-block"
            style={{ marginBottom: 'var(--space-3)', justifyContent: 'center' }}
            onClick={() => setCreateOpen(true)}
            id="search-add-food-btn"
          >
            + {t.foods.addNew}
          </button>

          {/* Food list */}
          {displayedFoods.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🥗</span>
              <span className="text-sm" style={{ marginBottom: 4 }}>
                {foods.length === 0 ? t.log.noFoodsYet : t.log.noFoodsFound}
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCreateOpen(true)}
                id="search-empty-create-btn"
              >
                {query ? `+ Crear "${query}"` : `+ ${t.foods.addNew}`}
              </button>
            </div>
          ) : (
            <div className="card">
              {displayedFoods.map((food) => (
                <button
                  key={food.id}
                  className="list-item"
                  style={{ width: '100%', textAlign: 'left', background: 'none' }}
                  onClick={() => handleSelectFood(food)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-medium text-base" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {food.isFavorite && <span style={{ marginRight: 4 }}>★</span>}
                      {food.name}
                    </div>
                    <div className="text-sm text-muted-2" style={{ marginTop: 2 }}>
                      {food.calories} kcal · P: {food.protein}g · C: {food.carbs}g · G: {food.fat}g
                      <span style={{ marginLeft: 8 }}>{t.log.per100g}</span>
                    </div>
                  </div>
                  <ChevronIcon />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Step 2 — Quantity entry */
        <div>
          {/* Food summary */}
          <div className="card card-padded" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="text-sm text-muted-2" style={{ marginBottom: 4 }}>{t.log.per100g}</div>
            <div className="macro-row">
              <MacroPill value={selectedFood.calories} label="kcal" color="var(--color-calories)" />
              <MacroPill value={selectedFood.protein}  label="Prot" color="var(--color-protein)" />
              <MacroPill value={selectedFood.carbs}    label="Carb" color="var(--color-carbs)" />
              <MacroPill value={selectedFood.fat}      label="Gras" color="var(--color-fat)" />
            </div>
          </div>

          {/* Quantity input */}
          <div className="input-group">
            <label className="input-label" htmlFor="quantity-input">{t.log.quantity}</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                ref={quantityRef}
                id="quantity-input"
                className="input"
                type="number"
                inputMode="decimal"
                min="1"
                max="5000"
                step="1"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                style={{ flex: 1 }}
              />
              <span className="text-muted font-medium">g</span>
            </div>
            {error && <span className="input-error">{error}</span>}
          </div>

          {/* Preview */}
          {preview && (
            <div className="card card-padded animate-in" style={{ marginBottom: 'var(--space-5)', background: 'var(--color-accent-dim)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <div className="text-sm text-muted-2" style={{ marginBottom: 8 }}>
                {t.log.perServing?.replace('{g}', quantity) || `Por ${quantity}g`}
              </div>
              <div className="macro-row">
                <MacroPill value={preview.calories} label="kcal" color="var(--color-calories)" />
                <MacroPill value={preview.protein}  label="Prot" color="var(--color-protein)" />
                <MacroPill value={preview.carbs}    label="Carb" color="var(--color-carbs)" />
                <MacroPill value={preview.fat}      label="Gras" color="var(--color-fat)" />
              </div>
            </div>
          )}

          {/* Quick quantity buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
            {[50, 100, 150, 200, 250].map((q) => (
              <button
                key={q}
                className={`btn btn-ghost btn-sm${quantity === String(q) ? ' btn-primary' : ''}`}
                onClick={() => setQuantity(String(q))}
                style={{ flex: 1, minWidth: 48 }}
              >
                {q}g
              </button>
            ))}
            {selectedFood?.servingSize && selectedFood.servingSize !== 100 && (
              <button
                className={`btn btn-ghost btn-sm${quantity === String(selectedFood.servingSize) ? ' btn-primary' : ''}`}
                onClick={() => setQuantity(String(selectedFood.servingSize))}
                style={{ flex: 1 }}
              >
                Ración ({selectedFood.servingSize}g)
              </button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>
              ← Volver
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd} id="confirm-add-food">
              {t.log.add}
            </button>
          </div>
        </div>
      )}
    </Modal>

    <FoodForm
      isOpen={createOpen}
      onClose={() => setCreateOpen(false)}
      onSave={handleCreateSave}
    />
  </>
);
}

function MacroPill({ value, label, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', flex: 1 }}>
      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-3)', marginTop: 1 }}>{label}</span>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
