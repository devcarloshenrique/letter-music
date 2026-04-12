import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { LoaderCircle, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { homeSearchSchema, type HomeSearchSchema } from '../schemas/home.schema';
import { useHome } from '../hooks/use-home';

export default function HomePage() {
  const { syncedLyricsMutation } = useHome();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<HomeSearchSchema>({
    resolver: zodResolver(homeSearchSchema),
    defaultValues: {
      query: ''
    }
  });

  const onSubmit = ({ query }: HomeSearchSchema) => {
    syncedLyricsMutation.mutate(query);
  };

  return (
    <section className='flex w-full max-w-screen-xl flex-col items-center text-center'>
      <motion.h1
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.45 }}
        className='mb-8 max-w-4xl text-4xl font-black leading-tight tracking-tighter text-white md:text-7xl'
      >
        Que música você gostaria de aprender hoje?
      </motion.h1>

      <form onSubmit={handleSubmit(onSubmit)} className='w-full max-w-2xl'>
        <div className='group relative'>
          <div className='pointer-events-none absolute inset-y-0 left-6 flex items-center text-on-surface-variant transition-colors group-focus-within:text-secondary'>
            <Search size={20} />
          </div>
          <input
            type='text'
            placeholder='Escreva o título, artista ou letra'
            className='w-full rounded-full border-none bg-surface-container-high py-5 pl-16 pr-8 text-lg text-white placeholder:text-on-surface-variant transition-all focus:ring-2 focus:ring-secondary/50 focus:outline-none'
            aria-label='Campo de busca de música'
            {...register('query')}
          />
        </div>
      </form>

      {errors.query && <p className='mt-3 text-sm text-error'>{errors.query.message}</p>}

      {syncedLyricsMutation.isPending && (
        <p className='mt-5 inline-flex items-center gap-2 text-sm text-secondary'>
          <LoaderCircle size={16} className='animate-spin' />
          Buscando legenda sincronizada...
        </p>
      )}

      {syncedLyricsMutation.isError && (
        <p className='mt-5 max-w-2xl rounded-full border border-error/30 bg-error/10 px-4 py-2 text-sm text-error'>
          {syncedLyricsMutation.error.message}
        </p>
      )}

      {syncedLyricsMutation.data && (
        <div className='mt-8 w-full max-w-3xl rounded-2xl border border-outline-variant bg-[#1d1b20]/75 p-5 text-left backdrop-blur-xl'>
          <p className='text-xs font-bold uppercase tracking-widest text-secondary'>Resultado</p>
          <p className='mt-2 text-sm text-on-surface-variant'>
            {syncedLyricsMutation.data.lines.length} linhas sincronizadas encontradas.
          </p>
          {syncedLyricsMutation.data.video_url && (
            <a
              href={syncedLyricsMutation.data.video_url}
              target='_blank'
              rel='noreferrer'
              className='mt-2 inline-block text-sm font-semibold text-primary hover:underline'
            >
              Abrir vídeo
            </a>
          )}

          <ul className='mt-4 max-h-60 space-y-2 overflow-auto pr-2'>
            {syncedLyricsMutation.data.lines.slice(0, 8).map((line) => (
              <li key={`${line.start}-${line.end}-${line.text}`} className='text-sm text-tertiary'>
                <span className='mr-2 text-xs text-secondary'>
                  [{line.start} - {line.end}]
                </span>
                {line.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
