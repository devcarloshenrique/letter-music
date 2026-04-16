import { Component, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface p-6 text-center">
          <span className="material-symbols-outlined text-error text-6xl mb-4">warning</span>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-on-surface-variant max-w-md">
            The application encountered an unexpected error. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-primary text-on-primary rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
