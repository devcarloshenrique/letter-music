import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Check, Eye, EyeOff, Lock, User, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiClient } from '../../lib/api-client';

type SettingsAuthModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

const loginSchema = z.object({
	login: z.string().min(1, 'Informe o login'),
	password: z.string().min(1, 'Informe a senha'),
	savePassword: z.boolean()
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginSuccessResponse = {
	success?: boolean;
	message?: string;
};

type LoginErrorResponse = {
	success?: false;
	error?: {
		message?: string;
	};
};

function getErrorMessage(error: unknown): string {
	if (axios.isAxiosError<LoginErrorResponse>(error)) {
		return error.response?.data?.error?.message ?? error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return 'Falha ao autenticar. Tente novamente.';
}

export function SettingsAuthModal({ isOpen, onClose }: SettingsAuthModalProps) {
	const [showPassword, setShowPassword] = useState(false);

	const handleCloseAndAbort = () => {
		window.dispatchEvent(new CustomEvent('auth:login-error'));
		onClose();
	};

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			login: '',
			password: '',
			savePassword: false
		}
	});

	const loginMutation = useMutation({
		mutationFn: async (payload: LoginForm) => {
const response = await apiClient.post<LoginSuccessResponse>('/api/auth/connect-letras', {
        email: payload.login,
        password: payload.password
      });

      return response.data;
    },
    onSuccess: () => {
      // Notifica o restante da aplicação que logou
      window.dispatchEvent(new CustomEvent('auth:login-success'));
      
      // Fecha localmente após 1 segundo
      setTimeout(() => {
        onClose();
      }, 1000);
		}
	});

	const onSubmit = handleSubmit((payload: LoginForm) => {
		loginMutation.mutate(payload);
	});

	if (!isOpen) {
		return null;
	}

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8'>
			<div className='absolute inset-0 bg-black/40' aria-hidden='true' onClick={handleCloseAndAbort} />

			<div className='relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-primary/25 bg-[rgba(15,14,17,0.4)] shadow-[0_0_60px_rgba(219,144,255,0.15)] backdrop-blur-[40px]'>
				<div className='flex items-center justify-between px-10 pb-4 pt-10'>
					<h2 className='text-3xl font-black tracking-tight text-white'>Settings</h2>
					<button
						type='button'
						aria-label='Fechar'
						onClick={handleCloseAndAbort}
						className='flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-on-surface-variant transition-colors hover:bg-white/10'
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={onSubmit} className='space-y-10 px-10 py-6'>
					<div>
						<div className='mb-8 flex items-center gap-3'>
							<div className='h-6 w-1 rounded-full bg-secondary' />
							<h3 className='text-sm font-bold uppercase tracking-[0.2em] text-secondary'>Configurações do Letras</h3>
						</div>

						<div className='space-y-8'>
							<div className='space-y-3'>
								<label htmlFor='settings-login' className='ml-1 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface/60'>
									Login
								</label>
								<div className='group relative'>
									<User size={20} className='absolute left-0 top-1/2 -translate-y-1/2 text-on-surface/40 transition-colors group-focus-within:text-secondary' />
									<input
										id='settings-login'
										type='text'
										placeholder='username@email.com'
										className='w-full border-0 border-b-2 border-outline-variant/20 bg-transparent pb-3 pl-9 pt-1 text-lg font-medium text-on-surface placeholder:text-outline/40 focus:border-secondary focus:outline-none'
										{...register('login')}
									/>
								</div>
								{errors.login && <p className='text-xs text-error'>{errors.login.message}</p>}
							</div>

							<div className='space-y-3'>
								<label
									htmlFor='settings-password'
									className='ml-1 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface/60'
								>
									Senha
								</label>
								<div className='group relative'>
									<Lock size={20} className='absolute left-0 top-1/2 -translate-y-1/2 text-on-surface/40 transition-colors group-focus-within:text-secondary' />
									<input
										id='settings-password'
										type={showPassword ? 'text' : 'password'}
										className='w-full border-0 border-b-2 border-outline-variant/20 bg-transparent pb-3 pl-9 pt-1 text-lg font-medium tracking-[0.2em] text-on-surface placeholder:text-outline/40 focus:border-secondary focus:outline-none'
										{...register('password')}
									/>
									<button
										type='button'
										aria-label='Mostrar ou ocultar senha'
										onClick={() => setShowPassword((previous) => !previous)}
										className='absolute right-0 top-1/2 -translate-y-1/2 text-on-surface/40 transition-colors hover:text-white'
									>
										{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
									</button>
								</div>
								{errors.password && <p className='text-xs text-error'>{errors.password.message}</p>}
							</div>

							<div className='flex items-center gap-4 pt-2'>
								<label className='relative flex cursor-pointer items-center'>
									<input
										type='checkbox'
										className='peer h-6 w-6 appearance-none rounded border-2 border-outline-variant/40 bg-transparent transition-all checked:border-secondary checked:bg-secondary focus:outline-none'
										{...register('savePassword')}
									/>
									<span className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100'>
										<Check size={16} className='text-black' />
									</span>
								</label>
								<span className='text-[12px] font-bold uppercase tracking-widest text-on-surface/70'>Salvar senha</span>
							</div>
						</div>
					</div>

					{loginMutation.isError && <p className='text-sm text-error'>{getErrorMessage(loginMutation.error)}</p>}
					{loginMutation.isSuccess && (
						<p className='text-sm text-secondary'>{loginMutation.data?.message ?? 'Autenticado com sucesso.'}</p>
					)}

					<div className='flex flex-col items-center px-0 pb-2 pt-4'>
						<button
							type='submit'
							disabled={loginMutation.isPending}
							className='w-full rounded-full bg-gradient-to-r from-primary to-primary-dim py-5 text-lg font-black text-on-primary-fixed shadow-[0_0_25px_rgba(219,144,255,0.5)] transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70'
						>
							{loginMutation.isPending ? 'SALVANDO...' : 'SALVAR'}
						</button>
						<button
							type='button'
							onClick={handleCloseAndAbort}
							className='mt-6 text-[11px] font-black uppercase tracking-[0.3em] text-on-surface/50 transition-colors hover:text-white'
						>
							CANCEL
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
