import { LoginFormInputs, RegisterFormInputs } from "@/lib/schemas/auth";
import api from "@/providers/api";
import type { User } from "@/types/user";

type AuthResponse = {
  token: string;
  user: User;
};

export const authService = {
  login: async (data: LoginFormInputs): Promise<AuthResponse> => {
    // A rota deve convergir com /auth/login definida em seu servidor NestJS/Node
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  createGuest: async (): Promise<AuthResponse> => {
    const response = await api.post("/auth/guest");
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  register: async (data: RegisterFormInputs) => {
    // O backend provavelmente não precisa do confirmPassword, então enviamos apenas o necessário
    const payload = {
      name: data.name,
      nickname: data.nickname,
      email: data.email,
      password: data.password,
      phone_number: data.phone_number,
    };
    const response = await api.post("/auth/register", payload);
    return response.data;
  },
};
