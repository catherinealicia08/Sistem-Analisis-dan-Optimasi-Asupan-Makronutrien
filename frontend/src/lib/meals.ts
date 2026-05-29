import type { LogItem, MealKey } from "../types";

export type { MealKey };

export const MEAL_LABEL: Record<MealKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const MEAL_ORDER: MealKey[] = ["breakfast", "lunch", "dinner", "snack"];

// Prefer the meal the user explicitly chose at add-time. Fall back to a
// stable hash for legacy entries logged before the picker existed.
export const mealOf = (item: LogItem): MealKey => {
  if (item.meal) return item.meal;
  const seed = hash(item.id);
  const bucket = seed % 4;
  return MEAL_ORDER[bucket];
};

export const groupByMeal = (items: LogItem[]): Record<MealKey, LogItem[]> => {
  const out: Record<MealKey, LogItem[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  for (const it of items) out[mealOf(it)].push(it);
  return out;
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const itemMacros = (it: LogItem) => {
  const r = it.grams / 100;
  return {
    calories: it.food.calories * r,
    protein: it.food.protein * r,
    carbs: it.food.carbs * r,
    fat: it.food.fat * r,
  };
};
