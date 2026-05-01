'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';

type AppLayoutProps = {
  children: React.ReactNode;
  initialUserId: string | null;
};

export default function AppLayout({ children, initialUserId }: AppLayoutProps) {
  const pathname = usePathname();
  const isPublicLayoutPage = pathname === '/' || pathname === '/login' || pathname === '/registro' || pathname === '/recuperar-contrasena';

  if (isPublicLayoutPage) {
    return (
      <AuthGuard initialUserId={initialUserId}>
        <div className="w-full h-full bg-surface-container-low text-on-surface overflow-auto">
          {children}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard initialUserId={initialUserId}>
      <div className="flex flex-col md:flex-row h-full w-full bg-surface text-on-surface overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col relative w-full bg-surface-container-low">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
