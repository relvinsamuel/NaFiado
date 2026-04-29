'use client';

import { usePosStore } from '@/lib/store';
import { CheckCircle2, X, Printer, RotateCcw } from 'lucide-react';
import { formatBs, formatUsd } from '@/lib/currency';

export default function CheckoutSuccessModal() {
  const { showSuccessModal, lastVenta, closeSuccessModal } = usePosStore();

  if (!showSuccessModal || !lastVenta) return null;

  const metodoPagoLabel: Record<string, string> = {
    'efectivo_usd': '💵 Efectivo USD',
    'efectivo_bs': '🇻🇪 Efectivo Bs',
    'pago_movil': '📱 Pago Móvil',
    'zelle': '💳 Zelle',
    'punto': '💳 Punto de Venta',
    'fiado': '📋 Fiado (Crédito)',
  };

  const fechaFormateada = new Date(lastVenta.created_at).toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con glassmorphism */}
      <div 
        className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
        onClick={closeSuccessModal}
      />
      
      {/* Modal */}
      <div className="relative bg-surface-container-lowest rounded-xl shadow-[0_10px_60px_rgba(26,28,28,0.15)] w-full max-w-md overflow-hidden animate-in">
        {/* Header con éxito */}
        <div className="bg-[#e8f5e9] px-6 py-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#4caf50] flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-manrope font-extrabold text-on-surface">¡Venta Exitosa!</h2>
          <p className="text-on-surface-variant text-sm mt-1">Transacción registrada correctamente</p>
        </div>

        {/* Detalles de la venta */}
        <div className="px-6 py-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Recibo</span>
            <span className="text-sm font-mono font-bold text-on-surface">#{lastVenta.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Artículos</span>
            <span className="text-sm font-medium text-on-surface">{lastVenta.items_count} unidades</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Método de pago</span>
            <span className="text-sm font-medium text-on-surface">{metodoPagoLabel[lastVenta.metodo_pago] || lastVenta.metodo_pago}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Fecha</span>
            <span className="text-sm font-medium text-on-surface">{fechaFormateada}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Tasa BCV</span>
            <span className="text-sm font-medium text-on-surface">1 USD = {Number(lastVenta.tasa_bcv).toFixed(2)} Bs</span>
          </div>
          
          {/* Total destacado */}
          <div className="bg-surface-container-low rounded-lg p-4 flex justify-between items-center mt-2">
            <span className="font-manrope font-bold text-lg text-on-surface">Total Cobrado</span>
            <div className="text-right">
              <span className="font-manrope font-extrabold text-2xl text-primary block">{formatBs(Number(lastVenta.total_bs))}</span>
              <span className="text-sm text-on-surface-variant">{formatUsd(Number(lastVenta.total))}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={closeSuccessModal}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-3 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <RotateCcw size={18} />
            Nueva Venta
          </button>
          <button
            onClick={() => {
              window.print();
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-md text-secondary font-semibold hover:bg-surface-container transition-colors"
          >
            <Printer size={18} />
          </button>
        </div>

        {/* Cerrar */}
        <button
          onClick={closeSuccessModal}
          className="absolute top-4 right-4 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
