import { useState } from 'react';
import { format } from 'date-fns';
import { useFoods, useFoodLog } from '../hooks/index.js';
import FoodSearch from '../components/food/FoodSearch.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { t } from '../i18n/es.js';

const today = format(new Date(), 'yyyy-MM-dd');

const MEALS = [
  { id: 'breakfast', label: t.dashboard.meals.breakfast, icon: '🌅' },
  { id: 'lunch',     label: t.dashboard.meals.lunch,     icon: '☀️' },
  { id: 'snack',     label: t.dashboard.meals.snack,     icon: '🍎' },
  { id: 'dinner',    label: t.dashboard.meals.dinner,    icon: '🌙' },
];

export default function Log() {
  const { foods, favorites, recent, createFood } = useFoods();
  const { addEntry } = useFoodLog(today);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const showToast = useToast();

  const handleMealTap = (meal) => {
    setSelectedMeal(meal);
    setSearchOpen(true);
  };

  const handleAdd = async (entry) => {
    await addEntry(entry);
    showToast(t.log.logged);
  };

  return (
    <div className="page">
      <div className="page-content">
        <div style={{ marginBottom: 'var(--space-6)', paddingTop: 'var(--space-2)' }}>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>{t.log.title}</h1>
          <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--font-sm)' }}>
            Selecciona la comida a registrar
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {MEALS.map(({ id, label, icon }) => (
            <button
              key={id}
              className="card"
              id={`log-${id}-btn`}
              onClick={() => handleMealTap(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-5)',
                textAlign: 'left',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
            >
              <span style={{ fontSize: 32 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-3)', marginTop: 2 }}>
                  Toca para añadir alimentos
                </div>
              </div>
              <ChevronIcon />
            </button>
          ))}
        </div>

        {/* Quick tip */}
        <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-accent-dim)', border: '1px solid rgba(20,184,166,0.2)' }}>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-accent)', fontWeight: 500 }}>
            💡 También puedes añadir alimentos directamente desde el inicio tocando el botón + de cada comida.
          </p>
        </div>
      </div>

      <FoodSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={handleAdd}
        onCreateFood={createFood}
        foods={foods}
        favorites={favorites}
        recent={recent}
        meal={selectedMeal}
      />
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--color-text-3)', flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
