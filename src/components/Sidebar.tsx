'use client';
import { Store, Users, FileText, Settings, BarChart3, Database, LayoutDashboard, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', enabled: true },
    { name: 'Punto de Venta', icon: Store, path: '/', enabled: true },
    { name: 'Inventario', icon: Database, path: '/inventory', enabled: true },
    { name: 'Clientes', icon: Users, path: '/clients', enabled: true },
    { name: 'Ventas', icon: ReceiptText, path: '/sales', enabled: true },
    { name: 'Facturas', icon: FileText, path: '/invoices', enabled: false },
    { name: 'Métricas', icon: BarChart3, path: '/metrics', enabled: false },
    { name: 'Configuración', icon: Settings, path: '/settings', enabled: false },
  ];

  return (
    <nav className="bg-surface h-16 md:h-full md:w-20 hover:md:w-64 flex md:flex-col items-center md:items-start justify-between md:justify-start px-6 md:px-4 md:py-8 shrink-0 z-50 relative transition-[width] duration-300 ease-in-out group overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 md:mb-12 w-full md:justify-center group-hover:md:justify-start group-hover:md:px-2 transition-all">
        <h1 className="text-3xl font-manrope font-extrabold text-[#1a3b2b] m-0 tracking-tight flex items-baseline md:hidden group-hover:md:flex">
          Naf<span className="text-primary relative inline-block">i<span className="absolute -top-1 -right-2 text-[16px] font-black">↗</span></span>ado
        </h1>
        {/* Ícono colapsado */}
        <h1 className="text-3xl font-manrope font-extrabold text-[#1a3b2b] m-0 tracking-tight flex items-baseline hidden md:flex group-hover:md:hidden">
          N<span className="text-primary relative inline-block">i<span className="absolute -top-1 -right-2 text-[16px] font-black">↗</span></span>
        </h1>
      </div>

      {/* Menu Principal */}
      <div className="flex md:flex-col gap-2 w-full overflow-x-auto md:overflow-visible">
        {menuItems.filter((item) => item.enabled).map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              title={item.name}
              className={`rounded-md p-3 flex items-center gap-4 transition-colors shrink-0 
                ${isActive 
                  ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-ambient' 
                  : 'text-secondary hover:bg-surface-container hover:text-on-surface'}`}
            >
              <item.icon />
              <span className="font-medium whitespace-nowrap hidden group-hover:md:block text-sm">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Footer del nav */}
      <div className="hidden md:flex mt-auto w-full flex-col gap-2">
         {/* No-line rule: replace spacer line with space or container */}
         <div className="w-full h-4"></div>
         <div className="rounded-md p-3 flex items-center gap-4 text-on-surface-variant bg-surface-container-lowest">
           <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center">
             <Users size={16} className="text-secondary" />
           </div>
           <div className="hidden group-hover:md:block overflow-hidden">
             <p className="text-sm text-on-surface whitespace-nowrap font-medium">Cajero Principal</p>
             <p className="text-xs text-on-surface-variant whitespace-nowrap font-inter">H2O Pinor</p>
           </div>
         </div>
      </div>
    </nav>
  );
}
