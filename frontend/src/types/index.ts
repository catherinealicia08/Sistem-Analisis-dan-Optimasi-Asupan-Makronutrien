export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "athlete";
export type Goal = "weight_loss" | "maintenance" | "muscle_gain";
export type Sex = "male" | "female";
export type DietaryPreference = "none" | "vegetarian" | "vegan" | "halal" | "pescatarian";

export interface User {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  weight: number;
  height: number;
  activity_level: ActivityLevel;
  goal: Goal;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
  target_weight?: number | null;
  dietary_preference?: DietaryPreference | null;
  allergies?: string[] | null;
  meal_frequency?: number | null;
}

export interface TokenPair {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ProfileSetupPayload {
  age: number;
  sex: Sex;
  weight: number;
  height: number;
  activity_level: ActivityLevel;
  goal: Goal;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  serving_size: number;
  // Optional, present on enriched (post-expansion) entries.
  subcategory?: string | null;
  source?: string | null;
  serving_unit?: string | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
}

export interface LogItem {
  id: string;
  food_id: string;
  grams: number;
  food: Food;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  items: LogItem[];
}

export interface MacroIntake {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MetabolicTargets {
  bmr: number;
  tdee: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
}

export interface QualityScores {
  protein_density: number;
  energy_density: number;
  macro_balance_score: number;
}

export interface DeficiencyInsight {
  nutrient: string;
  severity: "low" | "medium" | "high";
  message: string;
  delta: number;
}

export interface Analysis {
  targets: MetabolicTargets;
  intake: MacroIntake;
  fulfillment_pct: MacroIntake;
  quality: QualityScores;
  insights: DeficiencyInsight[];
}

export interface RecommendationItem {
  food: Food;
  grams: number;
  added_calories: number;
  added_protein: number;
  added_carbs: number;
  added_fat: number;
}

export interface OptimizationResult {
  status: string;
  objective_value: number;
  recommendations: RecommendationItem[];
  projected_intake: MacroIntake;
  projected_fulfillment_pct: MacroIntake;
}

/* ---------- Meal Planner ---------- */
export type MealKey = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealSlot {
  meal: MealKey;
  share: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  items: RecommendationItem[];
  totals: MacroIntake;
  status: string;
  objective_value: number;
}

export interface DailyMealPlan {
  id: string;
  user_id: string;
  date: string;
  targets: MetabolicTargets;
  distribution: Record<MealKey, number>;
  meals: MealSlot[];
  totals: MacroIntake;
  fulfillment_pct: MacroIntake;
}

export interface WeeklyMealPlan {
  user_id: string;
  start_date: string;
  end_date: string;
  days: DailyMealPlan[];
}

export interface GroceryEntry {
  food: Food;
  total_grams: number;
  pieces: number | null;
  appearances: number;
}

export interface GroceryList {
  user_id: string;
  start_date: string;
  end_date: string;
  days_covered: number;
  entries: GroceryEntry[];
}

export interface MealPlanGenerateInput {
  start_date?: string;
  distribution?: Record<MealKey, number>;
  days?: number;
  overwrite?: boolean;
}

/* ---------- Progress ---------- */
export interface DailyCompliance {
  date: string;
  intake: MacroIntake;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  score: number;
  energy_balance_kcal: number;
  macro_share: { protein: number; carbs: number; fat: number };
}

export interface AdherenceSummary {
  days: number;
  calorie_score: number;
  protein_score: number;
  carbs_score: number;
  fat_score: number;
  nas: number;
  classification: "Poor" | "Fair" | "Good" | "Excellent";
  avg_energy_balance: number;
  days_protein_target_met: number;
  insights: string[];
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  note?: string | null;
  created_at?: string;
}

export interface ProgressData {
  user_id: string;
  window_days: number;
  daily: DailyCompliance[];
  summary: AdherenceSummary;
  weight_history: WeightLog[];
  weight_change_kg: number | null;
}
