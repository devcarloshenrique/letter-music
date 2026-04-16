import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest w-full py-8 mb-20 border-t border-outline-variant/20">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 px-6">
        <span className="text-primary font-bold tracking-tight">Letter Music. Pure Harmony.</span>
        <div className="flex gap-6">
          <Link to="#" className="text-xs tracking-tight text-on-surface-variant hover:text-secondary-fixed transition-colors opacity-80 hover:opacity-100">Terms</Link>
          <Link to="#" className="text-xs tracking-tight text-on-surface-variant hover:text-secondary-fixed transition-colors opacity-80 hover:opacity-100">Privacy</Link>
          <Link to="#" className="text-xs tracking-tight text-on-surface-variant hover:text-secondary-fixed transition-colors opacity-80 hover:opacity-100">Support</Link>
        </div>
        <p className="text-xs tracking-tight text-on-surface-variant">© 2024 Letter Music. Pure Harmony.</p>
      </div>
    </footer>
  );
}
