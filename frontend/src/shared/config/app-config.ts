export const appConfig = {
  authEnabled: import.meta.env.VITE_AUTH_ENABLED === 'true'
} as const;
