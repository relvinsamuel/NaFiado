'use client';

import { useEffect, useState } from 'react';
import { Search, Lock } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';
import CartPanel from '@/components/CartPanel';
import CheckoutSuccessModal from '@/components/CheckoutSuccessModal';
import ModalAperturaCaja from '@/components/ModalAperturaCaja';
import ModalCierreCaja from '@/components/ModalCierreCaja';
import { useCurrencyStore } from '@/lib/currencyStore';
import { usePosStore } from '@/lib/store';
import { normalizeRate } from '@/lib/currency';

export default function PosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { bcvRate, setBcvRate } = useCurrencyStore();
  const [bcvDraft, setBcvDraft] = useState(bcvRate.toFixed(2));
  
  const { cashSession, fetchCurrentSession, isCashSessionLoading } = usePosStore();
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    setBcvDraft(bcvRate.toFixed(2));
  }, [bcvRate]);

  useEffect(() => {
    fetchCurrentSession();
  }, [fetchCurrentSession]);

  const commitBcvRate = () => {
    const parsed = Number(bcvDraft.replace(',', '.'));
    const nextRate = normalizeRate(parsed);
    setBcvRate(nextRate);
    setBcvDraft(nextRate.toFixed(2));
  };

  const isSessionOpen = cashSession?.estado === 'abierta';

  const handleToggleSession = () => {
    if (isSessionOpen) {
      setShowCloseModal(true);
    } else {
      setShowOpenModal(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-surface-container-low relative">
      {/* Main Content: Productos */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header POS */}
        <header className="h-20 shrink-0 bg-surface flex items-center px-8 gap-4 shadow-ambient z-10">
          <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 shrink-0">
            {/* Toggle de Caja */}
            <div className="flex items-center gap-2 pr-4 border-r border-outline-variant/30">
              <button
                onClick={handleToggleSession}
                disabled={isCashSessionLoading}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isSessionOpen ? 'bg-primary' : 'bg-surface-container-highest'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isSessionOpen ? 'translate-x-6' : 'translate-x-1'
                  } shadow-sm`}
                />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Caja</span>
                <span className={`text-xs font-bold ${isSessionOpen ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {isSessionOpen ? 'ABIERTA' : 'CERRADA'}
                </span>
              </div>
            </div>

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
              className="w-24 bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2 text-sm font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div className="relative flex-1 pr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
            <input 
              type="text" 
              placeholder="Buscar productos por nombre, código o categoría..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!isSessionOpen}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md pl-10 pr-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner disabled:opacity-50"
            />
          </div>
        </header>

        {/* Categories & Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative" id="productGridContainer">
          {!isSessionOpen && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-container-low/80 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                <Lock size={32} className="text-on-surface-variant" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Caja Cerrada</h3>
              <p className="text-on-surface-variant max-w-sm text-center mb-6">Debes abrir la caja para comenzar a procesar ventas y ver los productos.</p>
              <button
                onClick={() => setShowOpenModal(true)}
                className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
              >
                Abrir Caja Ahora
              </button>
            </div>
          )}
          <div className={!isSessionOpen ? 'opacity-30 pointer-events-none' : ''}>
            <ProductGrid searchQuery={searchQuery} />
          </div>
        </div>
      </div>

      {/* Cart Panel (Right) */}
      <CartPanel />

      {/* Modals */}
      <CheckoutSuccessModal />
      <ModalAperturaCaja isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} />
      <ModalCierreCaja isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} />
    </div>
  );
}
