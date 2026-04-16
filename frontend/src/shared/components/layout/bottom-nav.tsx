import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-surface-container-high/90 backdrop-blur-md border-t border-outline-variant/30 shadow-2xl">
      <Link to="/" className={`flex flex-col items-center justify-center transition-transform hover:text-primary active:scale-95 ${isActive('/') ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/') ? "'FILL' 1" : "" }}>home</span>
        <span className="text-[10px] mt-1">Home</span>
      </Link>
      <Link to="/explore" className={`flex flex-col items-center justify-center transition-transform hover:text-primary active:scale-95 ${isActive('/explore') ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/explore') ? "'FILL' 1" : "" }}>search</span>
        <span className="text-[10px] mt-1">Explore</span>
      </Link>
      <Link to="/library" className={`flex flex-col items-center justify-center transition-transform hover:text-primary active:scale-95 ${isActive('/library') ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/library') ? "'FILL' 1" : "" }}>library_music</span>
        <span className="text-[10px] mt-1">Library</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center justify-center transition-transform hover:text-primary active:scale-95 ${isActive('/profile') ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/profile') ? "'FILL' 1" : "" }}>person</span>
        <span className="text-[10px] mt-1">Profile</span>
      </Link>
    </nav>
  );
}
