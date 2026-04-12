import { RootLayout } from './layouts/root-layout';
import { AppProviders } from './providers/app-providers';
import { AppRoutes } from './routes/app-routes';

export function App() {
  return (
    <AppProviders>
      <RootLayout>
        <AppRoutes />
      </RootLayout>
    </AppProviders>
  );
}
