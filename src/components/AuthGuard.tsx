'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PUBLIC_AUTH_PAGES = new Set(['/login', '/registro', '/recuperar-contrasena']);

type AuthGuardProps = {
  children: React.ReactNode;
  initialUserId: string | null;
};

export default function AuthGuard({ children, initialUserId }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicAuthPage = PUBLIC_AUTH_PAGES.has(pathname);
  const isAuthenticated = Boolean(initialUserId);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublicAuthPage) {
        router.replace('/login');
      } else if (session && isPublicAuthPage) {
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isPublicAuthPage, router]);

  if (!isAuthenticated && !isPublicAuthPage) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
