'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';
import CartPanel from '@/components/CartPanel';
import CheckoutSuccessModal from '@/components/CheckoutSuccessModal';
import { useCurrencyStore } from '@/lib/currencyStore';
import { normalizeRate } from '@/lib/currency';

export default function PosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { bcvRate, setBcvRate } = useCurrencyStore();
  const [bcvDraft, setBcvDraft] = useState(bcvRate.toFixed(2));

  useEffect(() => {
    setBcvDraft(bcvRate.toFixed(2));
  }, [bcvRate]);

  const commitBcvRate = () => {
    const parsed = Number(bcvDraft.replace(',', '.'));
    const nextRate = normalizeRate(parsed);
    setBcvRate(nextRate);
    setBcvDraft(nextRate.toFixed(2));
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-surface-container-low">
      {/* Main Content: Productos */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header POS - No borders, just background shifts */}
        <header className="h-20 shrink-0 bg-surface flex items-center px-8 gap-4 shadow-ambient z-10">
          <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 min-w-[220px] shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Tasa BCV</p>
              <p className="text-xs text-on-surface-variant">1 USD = {bcvRate.toFixed(2)} Bs</p>
            </div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={bcvDraft}
              onChange={(e) => setBcvDraft(e.target.value)}
              onBlur={commitBcvRate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-28 bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2 text-sm font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div className="relative flex-1 pr-4">
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
