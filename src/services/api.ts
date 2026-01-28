import axios from 'axios';

export const api = axios.create({
  // Se estiver rodando local use localhost, se subiu na Vercel use a URL da Vercel
   //baseURL: 'http://localhost:8080/api', 
  baseURL: 'https://vs-diesel-backend.vercel.app/api',
});

// Interceptor para injetar o token
api.interceptors.request.use((config) => {
  // Pega o token que salvamos no Login
  const token = localStorage.getItem('vs_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para expulsar se o token vencer
api.interceptors.response.use(response => response, error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Se for erro de login, não faz nada (deixa o usuário tentar de novo)
        // Se for erro em outra rota, significa que o token expirou -> Logout
        if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('vs_token');
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});