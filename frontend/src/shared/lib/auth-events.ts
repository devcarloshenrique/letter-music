type AuthEventListener = () => void;

export const authEvents = {
  listeners: new Set<AuthEventListener>(),
  
  on401: (callback: AuthEventListener) => {
    authEvents.listeners.add(callback);
    return () => authEvents.listeners.delete(callback);
  },
  
  emit401: () => {
    authEvents.listeners.forEach(cb => cb());
  }
};
