'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AuthGuardProps = {
  children: React.ReactNode;
  initialUserId: string | null;
};

export default function AuthGuard({ children, initialUserId }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isAuthenticated = Boolean(initialUserId);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        router.replace('/login');
      } else if (session && isLoginPage) {
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  if (!isAuthenticated && !isLoginPage) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
