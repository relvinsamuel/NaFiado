'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col md:flex-row font-inter">
      {/* Columna Izquierda - Branding e Imagen Asimétrica */}
      <div className="hidden md:flex md:w-5/12 bg-surface-container-highest flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_left,_var(--color-primary)_0%,_transparent_50%)] pointer-events-none"></div>
        <div className="z-10 max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <h1 className="text-4xl font-manrope font-extrabold text-[#1a3b2b] m-0 tracking-tight flex items-baseline">
              Naf<span className="text-primary relative inline-block">i<span className="absolute -top-1 -right-2 text-xl font-black">↗</span></span>ado
            </h1>
          </div>
          <h2 className="text-4xl font-manrope font-extrabold text-on-surface mb-4 leading-tight">
            Gestión<br />Precisa del<br />Inventario.
          </h2>
          <p className="text-on-surface-variant text-lg">
            Plataforma SaaS centralizada. Control total, métricas en tiempo real y facturación eficiente para tu negocio.
          </p>
        </div>
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-surface-container-lowest">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="md:hidden mb-8">
             <h1 className="text-4xl font-manrope font-extrabold text-[#1a3b2b] m-0 tracking-tight flex items-baseline justify-center">
              Naf<span className="text-primary relative inline-block">i<span className="absolute -top-1 -right-2 text-xl font-black">↗</span></span>ado
            </h1>
          </div>

          <h2 className="text-3xl font-manrope font-bold text-on-surface mb-2">Ingresar al Sistema</h2>
          <p className="text-on-surface-variant mb-8">Introduce tus credenciales de operador.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger p-3 mb-4 rounded-md text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md pl-10 pr-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:bg-surface-container transition-all"
                  placeholder="operador@h2opinor.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md pl-10 pr-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors hover:bg-surface-container transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-3.5 px-4 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-ambient transition-all active:scale-[0.99] font-inter focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {loading ? 'Verificando...' : 'Acceder al POS'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
