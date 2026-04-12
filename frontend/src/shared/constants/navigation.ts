import { House, LibraryBig, Search, UserRound } from 'lucide-react';

export const navigationItems = [
  { label: 'Home', icon: House, href: '#' },
  { label: 'Buscar', icon: Search, href: '#' },
  { label: 'Biblioteca', icon: LibraryBig, href: '#' },
  { label: 'Perfil', icon: UserRound, href: '#' }
] as const;
