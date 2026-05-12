'use client';

import { useState } from 'react';
import { usePosStore } from '@/lib/store';
import { X, Square, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ModalCierreCaja({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { closeCashSession, cashSession } = usePosStore();
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [diferencia, setDiferencia] = useState(0);

  if (!isOpen || !cashSession) return null;

  const montoEsperado = Number(cashSession.monto_inicial) + Number(cashSession.total_efectivo);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const declarado = Number(montoDeclarado);
    setDiferencia(declarado - montoEsperado);
    setShowResult(true);
  };

  const handleCloseSession = async () => {
    setIsLoading(true);
    const success = await closeCashSession(Number(montoDeclarado));
    setIsLoading(false);
    if (success) {
      onClose();
      // Reset state for next time
      setTimeout(() => {
        setShowResult(false);
        setMontoDeclarado('');
      }, 500);
    }
  };

  const handleReset = () => {
    setShowResult(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface-container-lowest rounded-2xl shadow-[0_10px_60px_rgba(26,28,28,0.2)] w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-[#f44336]">
              <Square size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-lg font-manrope font-bold text-on-surface">Cerrar Turno (Arqueo)</h2>
              <p className="text-xs text-on-surface-variant">Cierre y cuadre de caja</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-outline hover:text-on-surface transition-colors rounded-full hover:bg-surface-container">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!showResult ? (
            <form id="close-cash-form" onSubmit={handleCalculate} className="space-y-6">
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex justify-between items-center">
                <span className="text-sm font-bold text-on-surface-variant">Fondo Inicial:</span>
                <span className="font-bold text-on-surface">{Number(cashSession.monto_inicial).toFixed(2)}$</span>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Efectivo Físico Contado</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={montoDeclarado}
                    onChange={(e) => setMontoDeclarado(e.target.value)}
                    className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl pl-10 pr-4 py-4 text-on-surface font-bold text-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-center tracking-wider"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-2 text-center">Cuenta todo el efectivo en tu gaveta e ingrésalo aquí.</p>
              </div>
            </form>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center">
                {diferencia === 0 ? (
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4caf50]/10 text-[#4caf50] mb-4">
                    <CheckCircle size={32} />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ff9800]/10 text-[#ff9800] mb-4">
                    <AlertTriangle size={32} />
                  </div>
                )}
                
                <h3 className="text-2xl font-black text-on-surface mb-1">
                  {diferencia === 0 ? '¡Caja Cuadrada!' : diferencia > 0 ? 'Sobrante en Caja' : 'Faltante en Caja'}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Esperado: <span className="font-bold">{montoEsperado.toFixed(2)}$</span>
                </p>
              </div>

              {diferencia !== 0 && (
                <div className={`p-4 rounded-xl text-center border ${diferencia > 0 ? 'bg-[#4caf50]/5 border-[#4caf50]/20 text-[#4caf50]' : 'bg-[#f44336]/5 border-[#f44336]/20 text-[#f44336]'}`}>
                  <p className="text-sm font-medium mb-1">Diferencia exacta:</p>
                  <p className="text-3xl font-black tracking-tight">{diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)}$</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex gap-3">
          {!showResult ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
              <button
                form="close-cash-form"
                type="submit"
                className="flex-1 py-3 rounded-xl font-bold text-white bg-secondary hover:bg-secondary-container hover:shadow-lg transition-all"
              >
                Calcular Cuadre
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Recalcular
              </button>
              <button
                type="button"
                onClick={handleCloseSession}
                disabled={isLoading}
                className="flex-[2] py-3 rounded-xl font-bold text-white bg-[#f44336] hover:bg-[#d32f2f] hover:shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar Cierre'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
