import { useEffect, useState } from 'react';
import { authEvents } from '../../lib/auth-events';

export function AuthOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const show = () => setIsVisible(true);
    const hide = () => setIsVisible(false);

    const unsubscribe = authEvents.on401(show);
    
    // Podemos escutar para fechar quando a refetch dar certo e o state normalizar,
    // mas por simplicidade vamos usar Window Event
    const hideListener = () => hide();
    window.addEventListener('auth:login-success', hideListener);
    window.addEventListener('auth:login-error', hideListener);
    
    return () => {
      unsubscribe();
      window.removeEventListener('auth:login-success', hideListener);
      window.removeEventListener('auth:login-error', hideListener);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center space-y-6 rounded-3xl bg-surface-high p-8 px-12 text-center shadow-2xl ring-1 ring-white/10 max-w-sm border border-surface-highest">
        <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary/20">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary mb-2">Conectando ao Letras...</h2>
          <p className="text-sm text-on-surface-variant">
            Uma janela do navegador foi aberta. Por favor, realize o login para continuar. Esta busca será retomada automaticamente.
          </p>
        </div>
        <div className="mt-4 flex space-x-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
        </div>
      </div>
    </div>
  );
}
