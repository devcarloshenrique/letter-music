type NavbarProps = {
  onOpenSettings?: () => void;
};

export function Navbar({}: NavbarProps) {
  return (
    <header className='fixed top-0 z-50 w-full border-b border-zinc-900/20 bg-zinc-950/60 backdrop-blur-2xl shadow-[0_20px_50px_rgba(219,144,255,0.05)]'>
      <nav className='mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-5 tracking-tight md:px-10 md:py-6'>
        <div className='text-2xl font-black italic tracking-tighter text-primary'>Letter Music</div>
      </nav>
    </header>
  );
}
