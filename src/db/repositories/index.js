// Repository layer for all database operations
// Each function is a pure async CRUD operation for a specific store.

import { getDB } from '../index.js';
import { v4 as uuid } from '../../lib/uuid.js';

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile() {
  const db = await getDB();
  return db.get('profile', 'profile');
}

export async function saveProfile(data) {
  const db = await getDB();
  return db.put('profile', data, 'profile');
}

// ─── Foods ────────────────────────────────────────────────────────────────────

export async function getAllFoods() {
  const db = await getDB();
  return db.getAll('foods');
}

export async function getFoodById(id) {
  const db = await getDB();
  return db.get('foods', id);
}

export async function saveFood(food) {
  const db = await getDB();
  const entry = { usageCount: 0, isFavorite: false, createdAt: new Date().toISOString(), ...food };
  if (!entry.id) entry.id = uuid();
  await db.put('foods', entry);
  return entry;
}

export async function deleteFood(id) {
  const db = await getDB();
  return db.delete('foods', id);
}

export async function toggleFoodFavorite(id) {
  const db = await getDB();
  const food = await db.get('foods', id);
  if (!food) return;
  food.isFavorite = !food.isFavorite;
  return db.put('foods', food);
}

export async function incrementFoodUsage(id) {
  const db = await getDB();
  const food = await db.get('foods', id);
  if (!food) return;
  food.usageCount = (food.usageCount || 0) + 1;
  return db.put('foods', food);
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function getLogsByDate(date) {
  const db = await getDB();
  return db.getAllFromIndex('dailyLogs', 'by_date', date);
}

export async function getAllLogs() {
  const db = await getDB();
  return db.getAll('dailyLogs');
}

export async function addLogEntry(entry) {
  const db = await getDB();
  const record = { ...entry, id: uuid(), loggedAt: new Date().toISOString() };
  await db.put('dailyLogs', record);
  return record;
}

export async function deleteLogEntry(id) {
  const db = await getDB();
  return db.delete('dailyLogs', id);
}

/** Copy all log entries from one date to another date. */
export async function copyLogsFromDate(fromDate, toDate, mealFilter = null) {
  const entries = await getLogsByDate(fromDate);
  const filtered = mealFilter ? entries.filter((e) => e.meal === mealFilter) : entries;
  const db = await getDB();
  const tx = db.transaction('dailyLogs', 'readwrite');
  const newEntries = filtered.map((e) => ({
    ...e,
    id: uuid(),
    date: toDate,
    loggedAt: new Date().toISOString(),
  }));
  await Promise.all([...newEntries.map((e) => tx.store.put(e)), tx.done]);
  return newEntries;
}

// ─── Weight Logs ──────────────────────────────────────────────────────────────

export async function getAllWeightLogs() {
  const db = await getDB();
  const all = await db.getAll('weightLogs');
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

export async function addWeightLog(entry) {
  const db = await getDB();
  // Check if entry for this date already exists (update it)
  const existing = await db.getFromIndex('weightLogs', 'by_date', entry.date);
  const record = {
    ...entry,
    id: existing?.id || uuid(),
    loggedAt: new Date().toISOString(),
  };
  await db.put('weightLogs', record);
  return record;
}

export async function deleteWeightLog(id) {
  const db = await getDB();
  return db.delete('weightLogs', id);
}

// ─── Exercise Logs ────────────────────────────────────────────────────────────

export async function getExerciseByDate(date) {
  const db = await getDB();
  return db.getAllFromIndex('exerciseLogs', 'by_date', date);
}

export async function getAllExerciseLogs() {
  const db = await getDB();
  return db.getAll('exerciseLogs');
}

export async function addExerciseLog(entry) {
  const db = await getDB();
  const record = { ...entry, id: uuid(), loggedAt: new Date().toISOString() };
  await db.put('exerciseLogs', record);
  return record;
}

export async function deleteExerciseLog(id) {
  const db = await getDB();
  return db.delete('exerciseLogs', id);
}
