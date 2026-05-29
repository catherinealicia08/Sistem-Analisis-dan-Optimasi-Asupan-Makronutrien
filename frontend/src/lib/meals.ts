import type { LogItem } from "../types";

export type MealKey = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_LABEL: Record<MealKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

// Stable assignment based on item id so the same logged item always lands in the
// same meal slot even though the API doesn't track meals natively.
export const mealOf = (item: LogItem): MealKey => {
  const seed = hash(item.id);
  const bucket = seed % 4;
  return (["breakfast", "lunch", "dinner", "snack"] as MealKey[])[bucket];
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
