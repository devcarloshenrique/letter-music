import { Settings } from 'lucide-react';

export function Navbar() {
  return (
    <header className='fixed top-0 z-50 w-full border-b border-zinc-900/20 bg-zinc-950/60 backdrop-blur-2xl shadow-[0_20px_50px_rgba(219,144,255,0.05)]'>
      <nav className='mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-5 tracking-tight md:px-10 md:py-6'>
        <div className='text-2xl font-black italic tracking-tighter text-primary'>Sonic Língua</div>

        <div className='hidden items-center gap-8 md:flex'>
          <a className='border-b-2 border-primary pb-1 font-bold text-white' href='#'>
            Discover
          </a>
          <a className='text-zinc-500 transition-colors hover:text-zinc-200' href='#'>
            Library
          </a>
          <a className='text-zinc-500 transition-colors hover:text-zinc-200' href='#'>
            Profile
          </a>
        </div>

        <div className='flex items-center gap-4'>
          <button
            type='button'
            aria-label='Configurações'
            className='interactive-scale premium-transition p-2 text-primary hover:opacity-80'
          >
            <Settings size={20} />
          </button>

          <div className='h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20'>
            <img
              alt='User profile'
              src='https://lh3.googleusercontent.com/aida-public/AB6AXuAjcwN4aQXTAjs6P2T4h_yCQw5B7LlxHQkkhi0nIe5X_OZSaIGZiFPHxXon9oWpRp283sTz1ZXV8a0deGDTBD-huMrml7HIjEQXRz18tJfE_ZN9dVY3G0zT_nwVC-FiTIVsizqc-Sakmd_mnaOBjCDfXBIxOCh3TPCxeBRSixDWFMFH1uDa0LwJOS_dNoNl6I6qywXHyoJKyV-p30rBYEGrMiGoTrJkwALlIdmxir6_o0XoxqPdRIBSoj3H0WJcZKfRm3umxgyVD83_'
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
