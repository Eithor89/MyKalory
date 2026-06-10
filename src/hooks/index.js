// Custom hooks for all data operations — these are the main interface between
// React components and the IndexedDB layer.

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  getProfile,
  saveProfile,
  getLogsByDate,
  addLogEntry,
  deleteLogEntry,
  copyLogsFromDate,
  getAllWeightLogs,
  addWeightLog,
  deleteWeightLog,
  getExerciseByDate,
  addExerciseLog,
  deleteExerciseLog,
  getAllFoods,
  saveFood,
  deleteFood,
  toggleFoodFavorite,
  incrementFoodUsage,
  getAllLogs,
  getAllExerciseLogs,
} from '../db/repositories/index.js';
import {
  calculateBMR,
  calculateTDEE,
  calculateTarget,
  calculateMacroTargets,
} from '../lib/calculations.js';

// ─── Profile Hook ─────────────────────────────────────────────────────────────

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p || null);
      setLoading(false);
    });
  }, []);

  const updateProfile = useCallback(async (data) => {
    await saveProfile(data);
    setProfile(data);
  }, []);

  // Derived metrics
  const metrics = profile
    ? (() => {
        const bmr = calculateBMR(profile);
        const tdee = calculateTDEE(bmr, profile.activityLevel);
        const target = calculateTarget(tdee, profile.goal);
        const macros = calculateMacroTargets(target);
        return { bmr: Math.round(bmr), tdee, target, macros };
      })()
    : null;

  return { profile, loading, updateProfile, metrics };
}

// ─── Food Log Hook ────────────────────────────────────────────────────────────

const todayStr = () => format(new Date(), 'yyyy-MM-dd');
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return format(d, 'yyyy-MM-dd');
};

export function useFoodLog(date = todayStr()) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    getLogsByDate(date).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (entry) => {
      const record = await addLogEntry({ ...entry, date });
      await incrementFoodUsage(entry.foodId);
      setEntries((prev) => [...prev, record]);
      return record;
    },
    [date]
  );

  const removeEntry = useCallback(async (id) => {
    await deleteLogEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const copyFromYesterday = useCallback(
    async (mealFilter = null) => {
      const yesterday = yesterdayStr();
      const copied = await copyLogsFromDate(yesterday, date, mealFilter);
      setEntries((prev) => [...prev, ...copied]);
      return copied.length;
    },
    [date]
  );

  // Group entries by meal
  const byMeal = {
    breakfast: entries.filter((e) => e.meal === 'breakfast'),
    lunch: entries.filter((e) => e.meal === 'lunch'),
    snack: entries.filter((e) => e.meal === 'snack'),
    dinner: entries.filter((e) => e.meal === 'dinner'),
  };

  // Daily totals
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: parseFloat((acc.protein + (e.protein || 0)).toFixed(1)),
      carbs: parseFloat((acc.carbs + (e.carbs || 0)).toFixed(1)),
      fat: parseFloat((acc.fat + (e.fat || 0)).toFixed(1)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { entries, byMeal, totals, loading, addEntry, removeEntry, copyFromYesterday, refresh };
}

// ─── All Logs Hook (for stats / export) ──────────────────────────────────────

export function useAllLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  return { logs, loading };
}

// ─── Weight Log Hook ──────────────────────────────────────────────────────────

export function useWeightLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    getAllWeightLogs().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(async (entry) => {
    const record = await addWeightLog(entry);
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date);
      return [...filtered, record].sort((a, b) => a.date.localeCompare(b.date));
    });
    return record;
  }, []);

  const removeEntry = useCallback(async (id) => {
    await deleteWeightLog(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  return { entries, latest, loading, addEntry, removeEntry, refresh };
}

// ─── Exercise Log Hook ────────────────────────────────────────────────────────

export function useExerciseLog(date = todayStr()) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    getExerciseByDate(date).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (entry) => {
      const record = await addExerciseLog({ ...entry, date });
      setEntries((prev) => [...prev, record]);
      return record;
    },
    [date]
  );

  const removeEntry = useCallback(async (id) => {
    await deleteExerciseLog(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const totalBurned = entries.reduce((s, e) => s + (e.caloriesBurned || 0), 0);

  return { entries, totalBurned, loading, addEntry, removeEntry, refresh };
}

// ─── All Exercise Logs Hook ───────────────────────────────────────────────────

export function useAllExerciseLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllExerciseLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  return { logs, loading };
}

// ─── Foods Hook ───────────────────────────────────────────────────────────────

export function useFoods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    getAllFoods().then((data) => {
      setFoods(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFood = useCallback(async (food) => {
    const saved = await saveFood(food);
    setFoods((prev) => [...prev, saved]);
    return saved;
  }, []);

  const updateFood = useCallback(async (food) => {
    const saved = await saveFood(food);
    setFoods((prev) => prev.map((f) => (f.id === food.id ? saved : f)));
    return saved;
  }, []);

  const removeFood = useCallback(async (id) => {
    await deleteFood(id);
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    await toggleFoodFavorite(id);
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isFavorite: !f.isFavorite } : f))
    );
  }, []);

  // Sorted lists
  const favorites = foods.filter((f) => f.isFavorite);
  const recent = [...foods].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 10);

  return { foods, favorites, recent, loading, createFood, updateFood, removeFood, toggleFavorite, refresh };
}
