import axios from 'axios';
import { authEvents } from './auth-events';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true
});

let failedQueue: Array<{ encode: (token?: string) => void; reject: (error: any) => void }> = [];
let isRefreshing = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se receber 401 e for erro do tipo AUTH_SESSION_EXPIRED
    if (error.response?.status === 401 && !originalRequest._retry) {
      const code = error.response?.data?.error?.code;
      if (code === 'AUTH_SESSION_EXPIRED') {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ encode: resolve, reject });
          }).then(() => apiClient(originalRequest));
        }

        originalRequest._retry = true;
        isRefreshing = true;
        
        // Emite o evento para abrir o modal de login nativo
        authEvents.emit401();

        return new Promise((resolve, reject) => {
          const successListener = () => {
            isRefreshing = false;
            failedQueue.forEach(({ encode }) => encode());
            failedQueue = [];
            cleanup();
            resolve(apiClient(originalRequest));
          };

          const errorListener = () => {
            isRefreshing = false;
            failedQueue.forEach(({ reject }) => reject(new Error('Login falhou ou cancelado')));
            failedQueue = [];
            cleanup();
            reject(error);
          };

          const cleanup = () => {
            window.removeEventListener('auth:login-success', successListener);
            window.removeEventListener('auth:login-error', errorListener);
          };

          window.addEventListener('auth:login-success', successListener);
          window.addEventListener('auth:login-error', errorListener);
        });
      }
    }
    return Promise.reject(error);
  }
);
