import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { homeSearchSchema, type HomeSearchSchema } from '../schemas/home.schema';

export default function HomePage() {
  const navigate = useNavigate();

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
    navigate(`/lyrics?url=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className='mx-auto flex h-full w-full max-w-screen-xl flex-col items-center justify-center px-8 pb-20 pt-24 text-center'>
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
    </section>
  );
}
