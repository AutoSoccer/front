import { LoginFormInputs, RegisterFormInputs } from "@/lib/schemas/auth";
import api from "@/providers/api";

export const authService = {
  login: async (data: LoginFormInputs) => {
    // A rota deve convergir com /auth/login definida em seu servidor NestJS/Node
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  getMe: async () => {
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
