'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building, CheckCircle, Loader2, Lock, Mail } from 'lucide-react';
import { registerTenantAdminAction } from '@/app/actions/auth';

type RegisterFormValues = {
  companyName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('companyName', data.companyName);
      formData.append('email', data.email);
      formData.append('password', data.password);

      const result = await registerTenantAdminAction(formData);

      if (result?.error) {
        setServerError(result.error);
        setIsLoading(false);
        return;
      }

      if (typeof result?.success === 'string') {
        setSuccessMessage(result.success);
        setIsLoading(false);
        return;
      }
    } catch {
      setServerError('No se pudo completar el registro. Intenta nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <section className="hidden lg:flex bg-[#e5e5e5] p-12 xl:p-16 flex-col justify-center">
        <div className="max-w-xl">
          <div className="mb-12">
            <h1 className="text-2xl font-bold text-[#1a362d] tracking-tight">
              Naf<span className="text-[#c2410c]">í</span>ado
            </h1>
          </div>

          <h2 className="text-5xl font-bold text-[#1a362d] leading-[1.05] tracking-tight">
            Gestión Precisa
            <br />
            del Inventario.
          </h2>

          <p className="text-gray-600 mt-6 max-w-md text-base leading-7">
            Plataforma SaaS centralizada. Control total, métricas en tiempo real y
            facturación eficiente para tu negocio.
          </p>
        </div>
      </section>

      <section className="bg-white flex items-center justify-center p-6 md:p-10 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-[#1a362d] tracking-tight">
              Naf<span className="text-[#c2410c]">í</span>ado
            </h1>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              Crea tu cuenta en Nafíado.
            </h1>
            <p className="text-gray-500">
              Registra tu empresa y activa tu entorno de trabajo.
            </p>
          </div>

          {successMessage ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
              <h2 className="text-xl font-bold text-green-900">Revisa tu correo</h2>
              <p className="mt-3 text-sm leading-6 text-green-800">{successMessage}</p>
              <p className="mt-6 text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-bold text-[#c2410c] hover:text-[#a3360a]">
                  Ingresa aquí
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {serverError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {serverError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-700">
                  Nombre de la Empresa
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Building className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="H2O Piñor"
                    className="w-full rounded-md border-transparent bg-[#e4e4e7] py-3 pl-10 pr-4 text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:bg-white focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20"
                    {...register('companyName', {
                      required: 'El nombre de la empresa es obligatorio',
                    })}
                  />
                </div>
                {errors.companyName && (
                  <p className="mt-1 text-xs text-red-500">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-700">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="admin@tunegocio.com"
                    className="w-full rounded-md border-transparent bg-[#e4e4e7] py-3 pl-10 pr-4 text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:bg-white focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20"
                    {...register('email', {
                      required: 'El correo es obligatorio',
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-700">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-md border-transparent bg-[#e4e4e7] py-3 pl-10 pr-4 text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:bg-white focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20"
                    {...register('password', {
                      required: 'La contraseña es obligatoria',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres',
                      },
                    })}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-md bg-[#c2410c] px-4 py-3 font-bold text-white transition-colors hover:bg-[#a3360a] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Comenzar Prueba Gratis'
                )}
              </button>

              <p className="pt-2 text-center text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-bold text-[#c2410c] hover:text-[#a3360a]">
                  Ingresa aquí
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}