// Calorie and macro calculations using Mifflin-St Jeor formula

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor.
 * @param {Object} profile - { sex, age, height, weight }
 * @returns {number} BMR in kcal/day
 */
export function calculateBMR(profile) {
  const { sex, age, height, weight } = profile;
  if (!sex || !age || !height || !weight) return 0;

  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

// Activity level multipliers (Mifflin-St Jeor standard)
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE).
 * @param {number} bmr
 * @param {string} activityLevel
 * @returns {number} TDEE in kcal/day
 */
export function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return Math.round(bmr * multiplier);
}

// Goal adjustments in kcal/day
export const GOAL_ADJUSTMENTS = {
  lose_moderate: -500,
  lose_slow: -250,
  maintain: 0,
  gain_slow: 250,
  gain_moderate: 500,
};

/**
 * Calculate daily calorie target based on TDEE and goal.
 * @param {number} tdee
 * @param {string} goal
 * @returns {number} Target calories/day
 */
export function calculateTarget(tdee, goal) {
  const adjustment = GOAL_ADJUSTMENTS[goal] ?? 0;
  return Math.max(1000, tdee + adjustment); // floor at 1000 kcal for safety
}

/**
 * Estimate weekly weight change rate based on calorie deficit/surplus.
 * 1 kg of body fat ≈ 7700 kcal.
 * @param {string} goal
 * @returns {{ kg: number, sign: string }}
 */
export function estimatedWeeklyChange(goal) {
  const dailyDelta = GOAL_ADJUSTMENTS[goal] ?? 0;
  const weeklyKcal = dailyDelta * 7;
  const kg = Math.abs(weeklyKcal / 7700);
  const sign = dailyDelta > 0 ? '+' : dailyDelta < 0 ? '-' : '±';
  return { kg: parseFloat(kg.toFixed(2)), sign };
}

/**
 * Scale macros from per-100g values to actual quantity.
 * @param {Object} food - { calories, protein, carbs, fat }
 * @param {number} quantity - grams
 * @returns {Object} Scaled nutritional values
 */
export function scaleMacros(food, quantity) {
  const ratio = quantity / 100;
  return {
    calories: Math.round(food.calories * ratio),
    protein: parseFloat((food.protein * ratio).toFixed(1)),
    carbs: parseFloat((food.carbs * ratio).toFixed(1)),
    fat: parseFloat((food.fat * ratio).toFixed(1)),
  };
}

/**
 * Sum macro values from an array of log entries.
 * @param {Array} entries
 * @returns {{ calories, protein, carbs, fat }}
 */
export function sumMacros(entries) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Calculate recommended macro distribution based on calorie target.
 * Distribution: 30% protein, 40% carbs, 30% fat (balanced approach)
 * @param {number} targetCalories
 * @returns {{ protein, carbs, fat }} in grams
 */
export function calculateMacroTargets(targetCalories) {
  return {
    protein: Math.round((targetCalories * 0.3) / 4),  // 4 kcal/g
    carbs: Math.round((targetCalories * 0.4) / 4),    // 4 kcal/g
    fat: Math.round((targetCalories * 0.3) / 9),      // 9 kcal/g
  };
}
