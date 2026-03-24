import axios from 'axios';

// Cria a instância base do Axios apontando para a URL da sua API
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição (Request)
// Útil para injetar o token de acesso (Bearer token) do usuário autenticado logado
api.interceptors.request.use(
  (config) => {
    // Exemplo de captura de token no lado do client:
    // const token = localStorage.getItem('access_token'); // Cuidado com uso no SSR (Server Components)
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta (Response)
// Útil para capturar erros globais, como 401 Unauthorized para fazer logout automático
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento global de erros
    if (error.response?.status === 401) {
      // Regra de logout automático ou redirecionamento
      // console.warn('Não autorizado, redirecionando para login...');
    }
    return Promise.reject(error);
  }
);

export default api;
