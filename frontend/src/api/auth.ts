import { http } from "./http";
import type { TokenPair, User, ProfileSetupPayload } from "../types";

export const authApi = {
  register: async (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }): Promise<TokenPair> => (await http.post<TokenPair>("/auth/register", data)).data,

  login: async (data: { email: string; password: string }): Promise<TokenPair> =>
    (await http.post<TokenPair>("/auth/login", data)).data,

  me: async (): Promise<User> => (await http.get<User>("/auth/me")).data,

  setupProfile: async (payload: ProfileSetupPayload): Promise<User> =>
    (await http.put<User>("/users/me/profile", payload)).data,
};
