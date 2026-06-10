import { useState } from 'react';
import { useFoods } from '../hooks/index.js';
import FoodForm from '../components/food/FoodForm.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { t } from '../i18n/es.js';

export default function Foods() {
  const { foods, createFood, updateFood, removeFood, toggleFavorite } = useFoods();
  const showToast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [query, setQuery] = useState('');

  const filtered = query
    ? foods.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : foods;

  // Sort: favorites first, then by usage
  const sorted = [...filtered].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return (b.usageCount || 0) - (a.usageCount || 0);
  });

  const handleSave = async (food) => {
    if (food.id) {
      await updateFood(food);
      showToast('Alimento actualizado');
    } else {
      await createFood(food);
      showToast('Alimento creado');
    }
    setFormOpen(false);
    setEditingFood(null);
  };

  const handleDelete = async (id) => {
    await removeFood(id);
    setConfirmDelete(null);
    showToast('Alimento eliminado');
  };

  const openEdit = (food) => {
    setEditingFood(food);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingFood(null);
    setFormOpen(true);
  };

  return (
    <div className="page">
      <div className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>{t.foods.title}</h1>
          <button className="btn btn-primary btn-sm" onClick={openCreate} id="add-food-btn">
            + {t.foods.addNew}
          </button>
        </div>

        {/* Search */}
        <div className="search-bar section">
          <span className="search-bar-icon"><SearchIcon /></span>
          <input
            className="input"
            type="search"
            placeholder={t.foods.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="foods-search-input"
          />
        </div>

        {/* Foods list */}
        {foods.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">🥘</span>
              <span className="text-sm">{t.foods.noFoods}</span>
              <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ marginTop: 8 }}>
                + {t.foods.addNew}
              </button>
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="text-sm text-muted-2">{t.log.noFoodsFound}</span>
            </div>
          </div>
        ) : (
          <div className="card animate-in">
            {sorted.map((food) => (
              <FoodItem
                key={food.id}
                food={food}
                onEdit={() => openEdit(food)}
                onDelete={() => setConfirmDelete(food.id)}
                onToggleFav={() => toggleFavorite(food.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Food form modal */}
      <FoodForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingFood(null); }}
        onSave={handleSave}
        food={editingFood}
      />

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal isOpen onClose={() => setConfirmDelete(null)} title="Confirmar">
          <p style={{ marginBottom: 'var(--space-5)', color: 'var(--color-text-2)' }}>{t.foods.deleteConfirm}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>{t.foods.cancel}</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)} id="confirm-delete-food-btn">{t.foods.delete}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FoodItem({ food, onEdit, onDelete, onToggleFav }) {
  return (
    <div className="list-item">
      <button
        onClick={onToggleFav}
        style={{ color: food.isFavorite ? 'var(--color-amber)' : 'var(--color-text-3)', flexShrink: 0, padding: '4px', background: 'none', transition: 'color var(--transition)' }}
        aria-label="Favorito"
      >
        {food.isFavorite ? '★' : '☆'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }} onClick={onEdit} role="button" tabIndex={0}>
        <div className="font-medium text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {food.name}
        </div>
        <div className="text-xs text-muted-2" style={{ marginTop: 2 }}>
          {food.calories} kcal · P:{food.protein}g C:{food.carbs}g G:{food.fat}g
          {food.usageCount > 0 && (
            <span style={{ marginLeft: 8, color: 'var(--color-text-3)' }}>· {food.usageCount}× usado</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onEdit} aria-label="Editar">
          <EditIcon />
        </button>
        <button className="btn btn-danger btn-sm btn-icon" onClick={onDelete} aria-label="Eliminar">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
