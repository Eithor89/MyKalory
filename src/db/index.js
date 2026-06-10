// IndexedDB database layer using the `idb` library
// All data is stored locally on the device — no server required.

import { openDB } from 'idb';

const DB_NAME = 'mykalory';
const DB_VERSION = 1;

/** Opens (or creates) the IndexedDB database with all required stores. */
export function openDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // ── Profile ─────────────────────────────────────────────────────────
      // Single-object store — we always use key 'profile'
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile');
      }

      // ── Custom Foods ─────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('foods')) {
        const foodStore = db.createObjectStore('foods', { keyPath: 'id' });
        foodStore.createIndex('by_name', 'name');
        foodStore.createIndex('by_usage', 'usageCount');
        foodStore.createIndex('by_favorite', 'isFavorite');
      }

      // ── Daily Meal Logs ──────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('dailyLogs')) {
        const logStore = db.createObjectStore('dailyLogs', { keyPath: 'id' });
        logStore.createIndex('by_date', 'date');
        logStore.createIndex('by_date_meal', ['date', 'meal']);
        logStore.createIndex('by_food', 'foodId');
      }

      // ── Weight Logs ──────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('weightLogs')) {
        const wStore = db.createObjectStore('weightLogs', { keyPath: 'id' });
        wStore.createIndex('by_date', 'date', { unique: true });
      }

      // ── Exercise Logs ─────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('exerciseLogs')) {
        const exStore = db.createObjectStore('exerciseLogs', { keyPath: 'id' });
        exStore.createIndex('by_date', 'date');
      }
    },
  });
}

// Singleton promise — reuse the same connection across the app
let dbPromise = null;
export function getDB() {
  if (!dbPromise) dbPromise = openDatabase();
  return dbPromise;
}
