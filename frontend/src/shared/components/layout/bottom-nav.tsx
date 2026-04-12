import { navigationItems } from '../../constants/navigation';
import { GlassPanel } from '../ui/glass-panel';

export function BottomNav() {
  return (
    <GlassPanel className='fixed inset-x-3 bottom-4 z-50 flex items-center justify-around rounded-full px-3 py-2 shadow-ambient md:hidden'>
      {navigationItems.map((item, index) => (
        <button
          key={item.label}
          type='button'
          aria-label={item.label}
          className={`interactive-scale premium-transition flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold ${
            index === 0 ? 'bg-primary text-background' : 'text-tertiary hover:text-secondary'
          }`}
        >
          <item.icon size={14} aria-hidden='true' />
          <span>{item.label}</span>
        </button>
      ))}
    </GlassPanel>
  );
}
