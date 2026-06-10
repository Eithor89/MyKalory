// Statistical trend calculations for weight data

/**
 * Calculate a simple moving average over a window of N days.
 * @param {Array<{ date: string, weight: number }>} entries - sorted ascending by date
 * @param {number} window - number of days (default 7)
 * @returns {Array<{ date: string, avg: number }>}
 */
export function movingAverage(entries, window = 7) {
  return entries.map((entry, idx) => {
    const start = Math.max(0, idx - window + 1);
    const slice = entries.slice(start, idx + 1);
    const avg = slice.reduce((sum, e) => sum + e.weight, 0) / slice.length;
    return { date: entry.date, avg: parseFloat(avg.toFixed(2)) };
  });
}

/**
 * Calculate weekly weight trend (kg/week) using linear regression on last N days.
 * @param {Array<{ date: string, weight: number }>} entries - sorted ascending
 * @param {number} days - how many recent days to use (default 14)
 * @returns {number} kg/week (positive = gaining, negative = losing)
 */
export function weeklyTrend(entries, days = 14) {
  if (entries.length < 2) return 0;

  const recent = entries.slice(-days);
  const n = recent.length;
  const baseline = new Date(recent[0].date).getTime();

  // Convert dates to day indices
  const points = recent.map((e) => ({
    x: (new Date(e.date).getTime() - baseline) / (1000 * 60 * 60 * 24),
    y: e.weight,
  }));

  // Linear regression: y = mx + b
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX); // kg/day
  const weeklyRate = slope * 7;

  return parseFloat(weeklyRate.toFixed(2));
}

/**
 * Calculate average calories for a given array of daily totals.
 * @param {Array<number>} dailyCalories
 * @returns {number}
 */
export function average(dailyCalories) {
  if (!dailyCalories.length) return 0;
  return Math.round(dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length);
}

/**
 * Group log entries by date and sum their calories.
 * @param {Array<{ date: string, calories: number }>} entries
 * @returns {Map<string, number>} date → total calories
 */
export function groupByDate(entries) {
  const map = new Map();
  for (const entry of entries) {
    map.set(entry.date, (map.get(entry.date) || 0) + entry.calories);
  }
  return map;
}

/**
 * Calculate cumulative energy balance over time.
 * @param {Array<{ date: string, calories: number }>} dailyTotals - sorted ascending
 * @param {number} targetCalories
 * @returns {Array<{ date: string, balance: number }>}
 */
export function cumulativeBalance(dailyTotals, targetCalories) {
  let running = 0;
  return dailyTotals.map(({ date, calories }) => {
    running += calories - targetCalories;
    return { date, balance: Math.round(running) };
  });
}

/**
 * Count how many days the user was within ±10% of their calorie target.
 * @param {Array<number>} dailyCalories
 * @param {number} target
 * @returns {{ onTarget: number, total: number, percentage: number }}
 */
export function goalAdherence(dailyCalories, target) {
  const threshold = target * 0.1;
  const onTarget = dailyCalories.filter(
    (c) => Math.abs(c - target) <= threshold
  ).length;
  return {
    onTarget,
    total: dailyCalories.length,
    percentage: dailyCalories.length
      ? Math.round((onTarget / dailyCalories.length) * 100)
      : 0,
  };
}
