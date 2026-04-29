'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClientStore } from '@/lib/clientStore';
import { ArrowLeft, Phone, Mail, MapPin, FileText, DollarSign, CreditCard, AlertTriangle, CheckCircle2, Plus, ChevronDown } from 'lucide-react';
import { bsToUsd, formatBs, formatUsd, usdToBs } from '@/lib/currency';
import { useCurrencyStore } from '@/lib/currencyStore';

const METODOS_ABONO = [
  { id: 'efectivo_usd', label: '💵 Efectivo USD' },
  { id: 'efectivo_bs',  label: '🇻🇪 Efectivo Bs' },
  { id: 'pago_movil',   label: '📱 Pago Móvil' },
  { id: 'zelle',        label: '💳 Zelle' },
  { id: 'punto',        label: '💳 Punto de Venta' },
];

export default function ClientDetailPage() {
  const { bcvRate } = useCurrencyStore();
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const {
    clients,
    fetchClients,
    fetchClientDetail,
    clearClientDetail,
    clientVentas,
    clientAbonos,
    clientBalance,
    isLoadingDetail,
    addAbono,
  } = useClientStore();

  const [tab, setTab] = useState<'historial' | 'fiado'>('historial');

  // Abono form
  const [showAbonoForm, setShowAbonoForm] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoMoneda, setAbonoMoneda] = useState('usd');
  const [abonoMetodo, setAbonoMetodo] = useState('efectivo_usd');
  const [abonoNota, setAbonoNota] = useState('');
  const [savingAbono, setSavingAbono] = useState(false);

  useEffect(() => {
    if (clients.length === 0) {
      fetchClients();
    }
  }, [clients.length, fetchClients]);

  const client = clients.find((c) => c.id === clientId) || null;

  useEffect(() => {
    if (clientId) fetchClientDetail(clientId);
    return () => clearClientDetail();
  }, [clientId, fetchClientDetail, clearClientDetail]);

  const handleAddAbono = async () => {
    const monto = parseFloat(abonoMonto);
    if (!monto || monto <= 0 || !client) return;
    setSavingAbono(true);
    const ok = await addAbono(client.id, client.workspace_id, monto, abonoMoneda, abonoMetodo, bcvRate, abonoNota.trim() || undefined);
    if (ok) {
      setAbonoMonto('');
      setAbonoMoneda('usd');
      setAbonoNota('');
      setShowAbonoForm(false);
    }
    setSavingAbono(false);
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
        <div className="w-8 h-8 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm">Cargando cliente...</p>
      </div>
    );
  }

  const { totalCompras, totalFiado, totalAbonos, saldoPendiente } = clientBalance;
  const ventasFiado = clientVentas.filter((v) => v.metodo_pago === 'fiado');
  const ventasPagadas = clientVentas.filter((v) => v.metodo_pago !== 'fiado');

  return (
    <div className="flex flex-col h-full w-full bg-surface-container-low overflow-auto">
      {/* Header */}
      <header className="shrink-0 bg-surface px-8 py-6 shadow-ambient z-10">
        <button onClick={() => router.push('/clients')} className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> Volver a Clientes
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-manrope font-extrabold text-on-surface">{client.nombre}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-on-surface-variant">
              {client.cedula && <span className="flex items-center gap-1"><FileText size={14} /> {client.cedula}</span>}
              {client.telefono && <span className="flex items-center gap-1"><Phone size={14} /> {client.telefono}</span>}
              {client.email && <span className="flex items-center gap-1"><Mail size={14} /> {client.email}</span>}
              {client.direccion && <span className="flex items-center gap-1"><MapPin size={14} /> {client.direccion}</span>}
            </div>
            {client.notas && <p className="text-xs text-outline mt-2 italic">{client.notas}</p>}
          </div>

          {/* Saldo prominente */}
          <div className={`rounded-lg p-4 min-w-[200px] text-center ${saldoPendiente > 0 ? 'bg-[#f44336]/10' : 'bg-[#4caf50]/10'}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Saldo Pendiente</p>
            <p className={`text-3xl font-manrope font-extrabold ${saldoPendiente > 0 ? 'text-[#f44336]' : 'text-[#4caf50]'}`}>
              {formatUsd(saldoPendiente)}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">{formatBs(usdToBs(saldoPendiente, bcvRate))}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">
              <DollarSign size={14} /> Total Compras
            </div>
            <p className="text-xl font-manrope font-extrabold text-on-surface">{formatBs(usdToBs(totalCompras, bcvRate))}</p>
            <p className="text-[11px] text-on-surface-variant">{formatUsd(totalCompras)}</p>
            <p className="text-[10px] text-on-surface-variant">{clientVentas.length} facturas</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-[#ff9800] text-xs font-bold uppercase tracking-wider mb-1">
              <AlertTriangle size={14} /> Total Fiado
            </div>
            <p className="text-xl font-manrope font-extrabold text-[#ff9800]">{formatUsd(totalFiado)}</p>
            <p className="text-[11px] text-on-surface-variant">{formatBs(usdToBs(totalFiado, bcvRate))}</p>
            <p className="text-[10px] text-on-surface-variant">{ventasFiado.length} ventas a crédito</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-1">
              <CheckCircle2 size={14} /> Total Abonos
            </div>
            <p className="text-xl font-manrope font-extrabold text-[#4caf50]">{formatUsd(totalAbonos)}</p>
            <p className="text-[11px] text-on-surface-variant">{formatBs(usdToBs(totalAbonos, bcvRate))}</p>
            <p className="text-[10px] text-on-surface-variant">{clientAbonos.length} pagos registrados</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">
              <CreditCard size={14} /> Pagadas
            </div>
            <p className="text-xl font-manrope font-extrabold text-on-surface">{formatUsd(totalCompras - totalFiado)}</p>
            <p className="text-[11px] text-on-surface-variant">{formatBs(usdToBs(totalCompras - totalFiado, bcvRate))}</p>
            <p className="text-[10px] text-on-surface-variant">{ventasPagadas.length} facturas pagadas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6">
          <button onClick={() => setTab('historial')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === 'historial' ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            Historial de Compras
          </button>
          <button onClick={() => setTab('fiado')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${tab === 'fiado' ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            Cuentas Pendientes
            {saldoPendiente > 0 && <span className="bg-[#f44336] text-white text-[10px] rounded-full px-1.5">{formatUsd(saldoPendiente)}</span>}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 md:px-8 md:py-6">
        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant">
            <div className="w-8 h-8 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin mb-4" />
          </div>
        ) : tab === 'historial' ? (
          /* Historial de todas las compras */
          <div className="bg-surface-container-lowest rounded-md overflow-hidden shadow-ambient">
            {clientVentas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant">
                <p className="text-sm">Este cliente no tiene compras aún</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Fecha</th>
                    <th className="text-left px-5 py-3">Método</th>
                    <th className="text-right px-5 py-3">Total</th>
                    <th className="text-center px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {clientVentas.map((v) => {
                    const isFiado = v.metodo_pago === 'fiado';
                    return (
                      <tr key={v.id} className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-5 py-3 text-on-surface">{new Date(v.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-5 py-3 text-on-surface-variant capitalize">{v.metodo_pago.replace('_', ' ')}</td>
                        <td className="px-5 py-3 text-right font-bold text-on-surface">
                          <div>
                            <span className="block">{formatBs(Number(v.total_bs || 0))}</span>
                            <span className="text-[11px] text-on-surface-variant">{formatUsd(Number(v.total))}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {isFiado ? (
                            <span className="bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold px-2.5 py-1 rounded-full">Fiado</span>
                          ) : (
                            <span className="bg-[#4caf50]/15 text-[#4caf50] text-xs font-bold px-2.5 py-1 rounded-full">Pagada</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Tab Fiado: deudas + abonos */
          <div className="space-y-6">
            {/* Botón registrar abono */}
            <div className="flex justify-end">
              <button onClick={() => setShowAbonoForm(!showAbonoForm)} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-2.5 px-4 hover:shadow-lg transition-all active:scale-[0.98] text-sm">
                <Plus size={16} /> Registrar Abono
              </button>
            </div>

            {/* Abono form */}
            {showAbonoForm && (
              <div className="bg-surface-container-lowest rounded-md p-5 shadow-ambient space-y-3">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider">Nuevo Abono</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Monto *</label>
                    <input type="number" step="0.01" min="0.01" value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} placeholder="0.00" className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Moneda</label>
                    <div className="relative">
                      <select value={abonoMoneda} onChange={(e) => setAbonoMoneda(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none">
                        <option value="usd">Divisas (USD)</option>
                        <option value="bs">Bolívares (Bs)</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Método de Pago</label>
                    <div className="relative">
                      <select value={abonoMetodo} onChange={(e) => setAbonoMetodo(e.target.value)} className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none">
                        {METODOS_ABONO.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-on-surface-variant mb-1">Nota (opcional)</label>
                    <input type="text" value={abonoNota} onChange={(e) => setAbonoNota(e.target.value)} placeholder="Ej: Abono parcial" className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Tasa del día: 1 USD = {bcvRate.toFixed(2)} Bs. Equivalente en USD: {formatUsd(abonoMoneda === 'bs' ? bsToUsd(Number(abonoMonto || 0), bcvRate) : Number(abonoMonto || 0))}
                </p>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddAbono} disabled={!abonoMonto || parseFloat(abonoMonto) <= 0 || savingAbono} className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-2 px-5 text-sm hover:shadow-md transition-all disabled:opacity-50">
                    {savingAbono ? 'Guardando...' : 'Confirmar Abono'}
                  </button>
                  <button onClick={() => setShowAbonoForm(false)} className="text-on-surface-variant text-sm hover:bg-surface-container px-4 py-2 rounded-md transition-colors">Cancelar</button>
                </div>
              </div>
            )}

            {/* Ventas fiado */}
            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#ff9800]" /> Ventas a Crédito (Fiado)
              </h3>
              {ventasFiado.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-md p-6 text-center text-on-surface-variant text-sm shadow-ambient">
                  Este cliente no tiene ventas a crédito
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-md overflow-hidden shadow-ambient">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                        <th className="text-left px-5 py-3">Fecha</th>
                        <th className="text-right px-5 py-3">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasFiado.map((v) => (
                        <tr key={v.id} className="border-t border-surface-container">
                          <td className="px-5 py-3 text-on-surface">{new Date(v.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-5 py-3 text-right font-bold text-[#ff9800]">
                            <div>
                              <span className="block">{formatUsd(Number(v.total))}</span>
                              <span className="text-[11px] text-on-surface-variant">{formatBs(Number(v.total_bs || 0))}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Abonos registrados */}
            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#4caf50]" /> Abonos Registrados
              </h3>
              {clientAbonos.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-md p-6 text-center text-on-surface-variant text-sm shadow-ambient">
                  No se han registrado abonos
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-md overflow-hidden shadow-ambient">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                        <th className="text-left px-5 py-3">Fecha</th>
                        <th className="text-left px-5 py-3">Método</th>
                        <th className="text-left px-5 py-3 hidden md:table-cell">Nota</th>
                        <th className="text-right px-5 py-3">Equivalente USD</th>
                        <th className="text-right px-5 py-3 hidden md:table-cell">Pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAbonos.map((a) => (
                        <tr key={a.id} className="border-t border-surface-container">
                          <td className="px-5 py-3 text-on-surface">{new Date(a.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-5 py-3 text-on-surface-variant capitalize">{a.metodo_pago.replace('_', ' ')}</td>
                          <td className="px-5 py-3 text-on-surface-variant text-xs hidden md:table-cell">{a.nota || '—'}</td>
                          <td className="px-5 py-3 text-right font-bold text-[#4caf50]">+{formatUsd(Number(a.monto_usd))}</td>
                          <td className="px-5 py-3 text-right font-bold text-on-surface hidden md:table-cell">
                            {a.moneda_pago === 'bs' ? formatBs(Number(a.monto_bs)) : formatUsd(Number(a.monto_usd))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
