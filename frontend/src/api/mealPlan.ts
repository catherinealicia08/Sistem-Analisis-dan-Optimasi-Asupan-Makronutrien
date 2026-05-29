import { http } from "./http";
import type {
  DailyMealPlan,
  GroceryList,
  MealPlanGenerateInput,
  WeeklyMealPlan,
} from "../types";

export const mealPlanApi = {
  week: async (start?: string, days = 7): Promise<WeeklyMealPlan> =>
    (await http.get<WeeklyMealPlan>("/me/meal-plan", {
      params: { start, days },
    })).data,

  generate: async (input: MealPlanGenerateInput = {}): Promise<WeeklyMealPlan> =>
    (await http.post<WeeklyMealPlan>("/me/meal-plan/generate", input)).data,

  grocery: async (start?: string, days = 7): Promise<GroceryList> =>
    (await http.get<GroceryList>("/me/grocery-list", {
      params: { start, days },
    })).data,

  day: async (userId: string, day: string): Promise<DailyMealPlan> =>
    (await http.get<DailyMealPlan>(`/users/${userId}/meal-plan/${day}`)).data,
};
