import { http } from "./http";
import type {
  Analysis,
  DailyLog,
  Food,
  LogItem,
  MacroIntake,
  MetabolicTargets,
  OptimizationResult,
  User,
} from "../types";

export const api = {
  // Users
  listUsers:   async (): Promise<User[]> => (await http.get<User[]>("/users")).data,
  getUser:     async (id: string): Promise<User> => (await http.get<User>(`/users/${id}`)).data,
  createUser:  async (data: Omit<User, "id">): Promise<User> => (await http.post<User>("/users", data)).data,
  updateUser:  async (id: string, data: Partial<Omit<User, "id">>): Promise<User> =>
    (await http.put<User>(`/users/${id}`, data)).data,
  getTargets:  async (id: string): Promise<MetabolicTargets> =>
    (await http.get<MetabolicTargets>(`/users/${id}/targets`)).data,

  // Foods
  listFoods: async (q?: string, category?: string): Promise<Food[]> => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (category) params.category = category;
    return (await http.get<Food[]>("/foods", { params })).data;
  },
  listCategories: async (): Promise<string[]> =>
    (await http.get<string[]>("/foods/categories")).data,

  // Logs
  getLog: async (userId: string, day: string): Promise<DailyLog> =>
    (await http.get<DailyLog>(`/users/${userId}/logs/${day}`)).data,

  addLogItem: async (userId: string, day: string, food_id: string, grams: number): Promise<LogItem> =>
    (await http.post<LogItem>(`/users/${userId}/logs/${day}/items`, { food_id, grams })).data,

  deleteLogItem: async (userId: string, day: string, itemId: string): Promise<void> => {
    await http.delete(`/users/${userId}/logs/${day}/items/${itemId}`);
  },

  weeklyIntake: async (userId: string, day: string): Promise<MacroIntake[]> =>
    (await http.get<MacroIntake[]>(`/users/${userId}/logs/weekly/${day}`)).data,

  // Analysis / optimization
  analyze: async (userId: string, day: string): Promise<Analysis> =>
    (await http.get<Analysis>(`/users/${userId}/analysis/${day}`)).data,

  optimize: async (userId: string, day: string): Promise<OptimizationResult> =>
    (await http.post<OptimizationResult>(`/users/${userId}/optimize/${day}`)).data,
};
