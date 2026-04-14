import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nafiado | POS SaaS",
  description: "Sistema de POS y CRM en la nube",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${manrope.variable} antialiased h-full`}>
      <body className="h-full overflow-hidden">
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
