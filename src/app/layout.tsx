import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import { createClient } from '@/utils/supabase/server';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nafiao | POS SaaS",
  description: "Sistema de POS y CRM en la nube",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es" className={`${inter.variable} ${manrope.variable} antialiased h-full`}>
      <body className="h-full overflow-hidden">
        <AppLayout initialUserId={user?.id ?? null}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
