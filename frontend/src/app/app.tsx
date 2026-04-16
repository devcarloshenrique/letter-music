import { RootLayout } from './layouts/root-layout';
import { ErrorBoundary } from "./ErrorBoundary";
import { AppProviders } from './providers/app-providers';
import { AppRoutes } from './routes/app-routes';
import { BrowserRouter } from 'react-router-dom';

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <RootLayout>
          <ErrorBoundary><AppRoutes /></ErrorBoundary>
        </RootLayout>
      </BrowserRouter>
    </AppProviders>
  );
}
