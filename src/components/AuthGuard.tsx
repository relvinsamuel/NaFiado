'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session && pathname === '/login') {
        router.push('/');
      }
      setIsLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session && pathname === '/login') {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Si está cargando y no estamos en login (que no requiere data de usuario inmediata), mostrar loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // En la página de login, no queremos renderizar el Sidebar (Children normal en layout). 
  // Por el momento devolveremos los children directos.
  return <>{children}</>;
}
