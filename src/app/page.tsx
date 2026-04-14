'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';
import CartPanel from '@/components/CartPanel';
import CheckoutSuccessModal from '@/components/CheckoutSuccessModal';

export default function PosPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-surface-container-low">
      {/* Main Content: Productos */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header POS - No borders, just background shifts */}
        <header className="h-20 shrink-0 bg-surface flex items-center px-8 gap-4 shadow-ambient z-10">
          <div className="mb-2">
            <h1 className="text-2xl font-manrope font-bold text-on-surface">Punto de Venta</h1>
            <p className="text-sm font-inter text-secondary">
              Espacio de Trabajo: <span className="font-semibold text-[#1a3b2b]">H2O Pinor</span>
            </p>
          </div>
          
          <div className="relative flex-1 max-w-xl pr-4 ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
            <input 
              type="text" 
              placeholder="Buscar productos por nombre, código o categoría..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md pl-10 pr-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
            />
          </div>
        </header>

        {/* Categories & Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8" id="productGridContainer">
          <ProductGrid searchQuery={searchQuery} />
        </div>
      </div>

      {/* Cart Panel (Right) */}
      <CartPanel />

      {/* Modal de Venta Exitosa */}
      <CheckoutSuccessModal />
    </div>
  );
}
