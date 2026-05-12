'use client';

import { useState, useEffect } from 'react';
import { usePosStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { X, Play, AlertTriangle, AlertCircle, PackageX, History } from 'lucide-react';

export default function ModalAperturaCaja({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { openCashSession, workspaceId, fetchWorkspaceId } = usePosStore();
  const [montoInicial, setMontoInicial] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertsLoading, setIsAlertsLoading] = useState(true);

  const [alerts, setAlerts] = useState<{
    lowStock: any[];
    expiring: any[];
    lastDiscrepancy: number | null;
  }>({
    lowStock: [],
    expiring: [],
    lastDiscrepancy: null,
  });

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    } else {
      setMontoInicial('0');
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    setIsAlertsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let wsId = workspaceId;
      if (!wsId) wsId = await fetchWorkspaceId();
      if (!wsId) return;

      const datePlus30 = new Date();
      datePlus30.setDate(datePlus30.getDate() + 30);
      const isoDate = datePlus30.toISOString();

      // Get low stock and expiring
      const { data: invData } = await supabase
        .from('inventario')
        .select('nombre, stock, fecha_vencimiento')
        .eq('workspace_id', wsId)
        .or(`stock.lte.5,fecha_vencimiento.lte.${isoDate}`);

      const lowStock = invData?.filter(p => p.stock !== null && p.stock <= 5) || [];
      const expiring = invData?.filter(p => p.fecha_vencimiento && new Date(p.fecha_vencimiento) <= datePlus30) || [];

      // Get last session discrepancy
      const { data: sessionData } = await supabase
        .from('sesiones_caja')
        .select('diferencia_cierre, fecha_cierre')
        .eq('tenant_id', wsId)
        .eq('usuario_id', user.id)
        .eq('estado', 'cerrada')
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .maybeSingle();

      setAlerts({
        lowStock,
        expiring,
        lastDiscrepancy: sessionData?.diferencia_cierre ?? null
      });

    } catch (e) {
      console.error(e);
    } finally {
      setIsAlertsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await openCashSession(Number(montoInicial));
    setIsLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface-container-lowest rounded-2xl shadow-[0_10px_60px_rgba(26,28,28,0.2)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Play size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-manrope font-bold text-on-surface">Abrir Caja</h2>
              <p className="text-xs text-on-surface-variant">Reporte matutino e inicio de turno</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-outline hover:text-on-surface transition-colors rounded-full hover:bg-surface-container">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Alertas */}
          {isAlertsLoading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.lastDiscrepancy !== null && alerts.lastDiscrepancy !== 0 && (
                <div className={`p-4 rounded-xl flex gap-3 ${alerts.lastDiscrepancy < 0 ? 'bg-[#f44336]/10 text-[#f44336]' : 'bg-[#4caf50]/10 text-[#4caf50]'}`}>
                  <History size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">Descuadre en turno anterior</h4>
                    <p className="text-xs mt-1">
                      {alerts.lastDiscrepancy < 0 ? 'Faltaron' : 'Sobraron'} {Math.abs(alerts.lastDiscrepancy).toFixed(2)}$ en el cierre previo.
                    </p>
                  </div>
                </div>
              )}

              {alerts.lowStock.length > 0 && (
                <div className="p-4 rounded-xl bg-[#ff9800]/10 text-[#ff9800] flex gap-3">
                  <PackageX size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">{alerts.lowStock.length} productos con bajo stock</h4>
                    <p className="text-xs mt-1">Ej: {alerts.lowStock.slice(0, 3).map(p => p.nombre).join(', ')}{alerts.lowStock.length > 3 ? '...' : ''}</p>
                  </div>
                </div>
              )}

              {alerts.expiring.length > 0 && (
                <div className="p-4 rounded-xl bg-[#f44336]/10 text-[#f44336] flex gap-3">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">{alerts.expiring.length} productos por vencer</h4>
                    <p className="text-xs mt-1 opacity-80">Vencen en los próximos 30 días.</p>
                  </div>
                </div>
              )}

              {alerts.lowStock.length === 0 && alerts.expiring.length === 0 && alerts.lastDiscrepancy === 0 && (
                <div className="p-4 rounded-xl bg-[#4caf50]/10 text-[#4caf50] flex gap-3 items-center">
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">Todo en orden. No hay alertas críticas.</span>
                </div>
              )}
            </div>
          )}

          {/* Formulario */}
          <form id="open-cash-form" onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-outline-variant/20">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Fondo de Caja (Efectivo Inicial)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl pl-10 pr-4 py-3 text-on-surface font-bold text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-2">Ingresa el dinero físico con el que arranca tu turno para poder dar vuelto.</p>
            </div>
          </form>
        </div>

        <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancelar
          </button>
          <button
            form="open-cash-form"
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary-container hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={18} />}
            Abrir Caja
          </button>
        </div>
      </div>
    </div>
  );
}
