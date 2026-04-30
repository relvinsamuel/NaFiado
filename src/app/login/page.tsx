'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Lock, Mail } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError('');

    try {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);

      const result = await loginAction(formData);

      if (result?.error) {
        setServerError(result.error);
        setIsLoading(false);
      }
    } catch {
      setServerError('No se pudo iniciar sesión. Intenta nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <section className="hidden lg:flex bg-[#e5e5e5] p-12 xl:p-16 flex-col justify-center">
        <div className="max-w-xl">
          <div className="mb-12">
            <h1 className="text-2xl font-bold text-[#1a362d] tracking-tight">
              Naf<span className="text-[#c2410c]">i</span>ao
            </h1>
          </div>

          <h2 className="text-5xl font-bold text-[#1a362d] leading-[1.05] tracking-tight">
            Gestión Precisa
            <br />
            del tu negocio.
          </h2>

          <p className="text-gray-600 mt-6 max-w-md text-base leading-7">
            Control total, métricas en tiempo real y facturación eficiente para tu negocio.
          </p>
        </div>
      </section>

      <section className="bg-white flex items-center justify-center p-6 md:p-10 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-[#1a362d] tracking-tight">
              Naf<span className="text-[#c2410c]">i</span>ao
            </h1>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              Ingresar al Sistema
            </h1>
            <p className="text-gray-500">
              Introduce tus credenciales de operador.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  placeholder="operador@h2opinor.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#e4e4e7] border-transparent rounded-md focus:bg-white focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20 transition-colors outline-none text-gray-800 placeholder-gray-400"
                  {...register('email', { required: 'El correo es obligatorio' })}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#e4e4e7] border-transparent rounded-md focus:bg-white focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20 transition-colors outline-none text-gray-800 placeholder-gray-400"
                  {...register('password', { required: 'La contraseña es obligatoria' })}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#c2410c] hover:bg-[#a3360a] text-white font-bold py-3 px-4 rounded-md transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Acceder al POS'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
