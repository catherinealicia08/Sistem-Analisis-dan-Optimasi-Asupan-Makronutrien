import { http } from "./http";
import type { ProgressData, WeightLog } from "../types";

export const progressApi = {
  get: async (days = 7): Promise<ProgressData> =>
    (await http.get<ProgressData>("/me/progress", { params: { days } })).data,

  logWeight: async (input: { weight: number; date?: string; note?: string }): Promise<WeightLog> =>
    (await http.post<WeightLog>("/me/weight", input)).data,

  history: async (days = 90): Promise<WeightLog[]> =>
    (await http.get<WeightLog[]>("/me/weight-history", { params: { days } })).data,
};
