'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Camera,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FilePlus2,
  Plus,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useInventoryStore } from '@/lib/inventoryStore';
import ProductFormModal from '@/components/inventory/ProductFormModal';
import { useCurrencyStore } from '@/lib/currencyStore';
import { formatBs, formatUsd, usdToBs } from '@/lib/currency';

type NotificationTab = 'inventory' | 'financial';
type RestockTab = 'out' | 'low';

interface VentaRow {
  total: number | null;
  metodo_pago: string | null;
  created_at: string;
}

interface PayableItem {
  id: string;
  label: string;
  amountUsd: number;
  dueDate: string;
}

function toDayStart(d: Date) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDayEnd(d: Date) {
  const next = new Date(d);
  next.setHours(23, 59, 59, 999);
  return next;
}

function toMonthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getByKeys(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  return null;
}

export default function DashboardPage() {
  const { bcvRate } = useCurrencyStore();
  const {
    products,
    fetchProducts,
    openNewProduct,
    isFormOpen,
    fetchWorkspaceId,
    workspaceId,
  } = useInventoryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState<NotificationTab>('inventory');
  const [restockTab, setRestockTab] = useState<RestockTab>('out');
  const [monthlyGoalUsd, setMonthlyGoalUsd] = useState(() => readDashboardNumber('nafiado-dashboard-monthly-goal', 8000, 100));
  const [lowStockThreshold, setLowStockThreshold] = useState(() => readDashboardNumber('nafiado-dashboard-low-threshold', 3, 1));
  const [dueAlertDays, setDueAlertDays] = useState(() => readDashboardNumber('nafiado-dashboard-due-days', 2, 1));
  const [ventasHoy, setVentasHoy] = useState(0);
  const [ventasSemanaPasada, setVentasSemanaPasada] = useState(0);
  const [ventasMes, setVentasMes] = useState(0);
  const [ingresosNetos, setIngresosNetos] = useState(0);
  const [volumenHoy, setVolumenHoy] = useState(0);
  const [payables, setPayables] = useState<PayableItem[]>([]);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('nafiado-dashboard-monthly-goal', String(monthlyGoalUsd));
  }, [monthlyGoalUsd]);

  useEffect(() => {
    localStorage.setItem('nafiado-dashboard-low-threshold', String(lowStockThreshold));
  }, [lowStockThreshold]);

  useEffect(() => {
    localStorage.setItem('nafiado-dashboard-due-days', String(dueAlertDays));
  }, [dueAlertDays]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);

      let wsId = workspaceId;
      if (!wsId) {
        wsId = await fetchWorkspaceId();
      }

      if (!wsId) {
        setIsLoading(false);
        return;
      }

      await fetchProducts();

      const now = new Date();
      const dayStart = toDayStart(now);
      const dayEnd = toDayEnd(now);
      const prevWeekStart = new Date(dayStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(dayEnd);
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
      const monthStart = toMonthStart(now);

      const [todayRes, prevWeekRes, monthRes, payablesRows, gastosTotal] = await Promise.all([
        supabase
          .from('ventas')
          .select('total, metodo_pago, created_at')
          .eq('workspace_id', wsId)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString()),
        supabase
          .from('ventas')
          .select('total, created_at')
          .eq('workspace_id', wsId)
          .gte('created_at', prevWeekStart.toISOString())
          .lte('created_at', prevWeekEnd.toISOString()),
        supabase
          .from('ventas')
          .select('total, metodo_pago, created_at')
          .eq('workspace_id', wsId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', dayEnd.toISOString()),
        loadPayables(wsId),
        loadGastos(wsId),
      ]);

      const todayData: VentaRow[] = (todayRes.data as VentaRow[]) || [];
      const prevData: VentaRow[] = (prevWeekRes.data as VentaRow[]) || [];
      const monthData: VentaRow[] = (monthRes.data as VentaRow[]) || [];

      const todayTotal = todayData.reduce((sum, row) => sum + asNumber(row.total), 0);
      const prevTotal = prevData.reduce((sum, row) => sum + asNumber(row.total), 0);
      const monthTotal = monthData.reduce((sum, row) => sum + asNumber(row.total), 0);
      const cobradasMonth = monthData
        .filter((row) => row.metodo_pago !== 'fiado')
        .reduce((sum, row) => sum + asNumber(row.total), 0);

      setVentasHoy(todayTotal);
      setVentasSemanaPasada(prevTotal);
      setVentasMes(monthTotal);
      setVolumenHoy(todayData.length);
      setIngresosNetos(cobradasMonth - gastosTotal);
      setPayables(payablesRows);
      setIsLoading(false);
    };

    loadDashboard();
  }, [fetchProducts, fetchWorkspaceId, workspaceId]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= lowStockThreshold),
    [products, lowStockThreshold]
  );
  const outOfStockProducts = useMemo(() => products.filter((p) => (p.stock ?? 0) === 0), [products]);

  const growthPct = useMemo(() => {
    if (ventasSemanaPasada <= 0) return ventasHoy > 0 ? 100 : 0;
    return ((ventasHoy - ventasSemanaPasada) / ventasSemanaPasada) * 100;
  }, [ventasHoy, ventasSemanaPasada]);

  const monthGoalPct = useMemo(() => {
    if (monthlyGoalUsd <= 0) return 0;
    return Math.min(100, (ventasMes / monthlyGoalUsd) * 100);
  }, [ventasMes, monthlyGoalUsd]);

  const inventoryAlerts = useMemo(() => {
    const critical = outOfStockProducts.map((p) => ({
      id: `${p.codigo}-out`,
      text: `${p.nombre} está agotado (SKU: ${p.codigo})`,
      severity: 'high' as const,
    }));
    const low = lowStockProducts.map((p) => ({
      id: `${p.codigo}-low`,
      text: `${p.nombre} en mínimo (${p.stock ?? 0} uds)`,
      severity: 'medium' as const,
    }));
    return [...critical, ...low].slice(0, 8);
  }, [lowStockProducts, outOfStockProducts]);

  const financialAlerts = useMemo(() => {
    const now = toDayStart(new Date());
    return payables
      .map((item) => {
        const due = toDayStart(new Date(item.dueDate));
        const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: item.id,
          text: `${item.label} vence ${diff <= 0 ? 'hoy o vencido' : `en ${diff} día(s)`}`,
          severity: diff < 0 ? ('high' as const) : diff <= dueAlertDays ? ('medium' as const) : ('low' as const),
        };
      })
      .sort((a, b) => (a.severity === 'high' ? -1 : 1) - (b.severity === 'high' ? -1 : 1))
      .slice(0, 8);
  }, [dueAlertDays, payables]);

  const notificationCount = inventoryAlerts.length + financialAlerts.length;
  const restockRows = restockTab === 'out' ? outOfStockProducts : lowStockProducts;

  return (
    <div className="flex flex-col h-full w-full bg-surface-container-low overflow-auto">
      <header className="sticky top-0 z-20 bg-surface px-4 md:px-8 py-4 shadow-ambient">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md px-4 py-2.5 text-sm hover:shadow-lg transition-all"
            >
              <Plus size={16} /> Nueva Venta (POS)
            </Link>
            <button
              onClick={openNewProduct}
              className="inline-flex items-center gap-2 bg-surface-container text-on-surface font-semibold rounded-md px-4 py-2.5 text-sm hover:bg-surface-container-high transition-colors"
            >
              <FilePlus2 size={16} /> Agregar Producto Manual
            </button>
            <button
              onClick={() => scanInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-semibold rounded-md px-4 py-2.5 text-sm hover:brightness-95 transition-all"
            >
              <Camera size={16} /> Escanear Factura
            </button>
            <input
              ref={scanInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={() => alert('Flujo OCR/IA listo para integrar. Aquí se captura el archivo/cámara.')}
            />
          </div>

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2.5 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#f44336] text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[320px] md:w-[380px] bg-surface-container-lowest rounded-lg shadow-[0_8px_40px_rgba(26,28,28,0.14)] overflow-hidden border border-outline-variant/20">
                <div className="flex p-2 bg-surface-container-low gap-2">
                  <button
                    onClick={() => setNotificationTab('inventory')}
                    className={`flex-1 rounded-md px-3 py-2 text-xs font-bold ${notificationTab === 'inventory' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    Alertas Inventario
                  </button>
                  <button
                    onClick={() => setNotificationTab('financial')}
                    className={`flex-1 rounded-md px-3 py-2 text-xs font-bold ${notificationTab === 'financial' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    Alertas Financieras
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {(notificationTab === 'inventory' ? inventoryAlerts : financialAlerts).length === 0 && (
                    <p className="text-xs text-on-surface-variant p-3">Sin alertas pendientes.</p>
                  )}
                  {(notificationTab === 'inventory' ? inventoryAlerts : financialAlerts).map((item) => (
                    <div key={item.id} className="p-3 rounded-md hover:bg-surface-container-low transition-colors">
                      <p className="text-sm text-on-surface">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="px-4 md:px-8 py-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Ventas del Día"
          valuePrimary={formatBs(usdToBs(ventasHoy, bcvRate))}
          valueSecondary={formatUsd(ventasHoy)}
          footer={`${growthPct >= 0 ? '↑' : '↓'} ${Math.abs(growthPct).toFixed(1)}% vs mismo día semana pasada`}
          footerColor={growthPct >= 0 ? 'text-[#4caf50]' : 'text-[#f44336]'}
          icon={<TrendingUp size={16} />}
          loading={isLoading}
        />
        <KpiCard
          title="Ventas del Mes"
          valuePrimary={formatBs(usdToBs(ventasMes, bcvRate))}
          valueSecondary={formatUsd(ventasMes)}
          footer={`Meta: ${formatUsd(monthlyGoalUsd)}`}
          progress={monthGoalPct}
          icon={<DollarSign size={16} />}
          loading={isLoading}
        />
        <KpiCard
          title="Ingresos Totales (Caja Real)"
          valuePrimary={formatBs(usdToBs(ingresosNetos, bcvRate))}
          valueSecondary={formatUsd(ingresosNetos)}
          footer="Ventas cobradas - Gastos registrados"
          footerColor={ingresosNetos >= 0 ? 'text-[#4caf50]' : 'text-[#f44336]'}
          icon={<ReceiptText size={16} />}
          loading={isLoading}
        />
        <KpiCard
          title="Volumen Operativo"
          valuePrimary={`${volumenHoy}`}
          valueSecondary="tickets/facturas emitidas hoy"
          footer="Mide tráfico y picos de caja"
          icon={<ShoppingCart size={16} />}
          loading={isLoading}
        />
      </section>

      <section className="px-4 md:px-8 pb-8 grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <div className="bg-surface-container-lowest rounded-lg shadow-ambient overflow-hidden">
          <div className="p-4 md:p-5 border-b border-outline-variant/20 flex flex-wrap items-center gap-2 justify-between">
            <div>
              <h2 className="text-lg font-manrope font-extrabold text-on-surface">Panel de Reabastecimiento</h2>
              <p className="text-xs text-on-surface-variant">Zona prioritaria de acción logística</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRestockTab('out')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${restockTab === 'out' ? 'bg-[#f44336] text-white' : 'bg-surface-container text-on-surface-variant'}`}
              >
                Agotados ({outOfStockProducts.length})
              </button>
              <button
                onClick={() => setRestockTab('low')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${restockTab === 'low' ? 'bg-[#ff9800] text-white' : 'bg-surface-container text-on-surface-variant'}`}
              >
                Bajo Stock ({lowStockProducts.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Producto (SKU)</th>
                  <th className="text-center px-4 py-3">Stock Actual</th>
                  <th className="text-center px-4 py-3">Stock Mínimo</th>
                  <th className="text-left px-4 py-3">Último Proveedor</th>
                  <th className="text-right px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {restockRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                      No hay productos en este estado.
                    </td>
                  </tr>
                )}
                {restockRows.map((product) => (
                  <tr key={`${product.workspace_id}-${product.codigo}`} className="border-t border-outline-variant/20">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{product.nombre}</p>
                      <p className="text-xs text-on-surface-variant">SKU: {product.codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-on-surface">{product.stock ?? 0}</td>
                    <td className="px-4 py-3 text-center text-on-surface-variant">{lowStockThreshold}</td>
                    <td className="px-4 py-3 text-on-surface-variant">Sin registro</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => alert(`Orden sugerida para ${product.nombre} (SKU: ${product.codigo})`) }
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary-container text-on-primary px-3 py-2 rounded-md text-xs font-bold"
                      >
                        Generar Orden <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg shadow-ambient p-4 md:p-5 space-y-5 h-fit">
          <div>
            <h2 className="text-lg font-manrope font-extrabold text-on-surface">Cuentas por Pagar</h2>
            <p className="text-xs text-on-surface-variant">Facturas próximas y tareas pendientes</p>
          </div>

          <div className="space-y-2.5">
            {payables.length === 0 && <p className="text-sm text-on-surface-variant">No hay facturas por pagar registradas.</p>}
            {payables.slice(0, 6).map((item) => {
              const urgency = getUrgency(item.dueDate, dueAlertDays);
              return (
                <div key={item.id} className="rounded-md bg-surface-container-low p-3">
                  <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                  <p className="text-xs text-on-surface-variant">{formatBs(usdToBs(item.amountUsd, bcvRate))} · {formatUsd(item.amountUsd)}</p>
                  <p className={`text-xs font-bold mt-1 ${urgency.className}`}>{urgency.label}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-md bg-surface-container-low p-3 space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <ClipboardList size={15} />
              <p className="text-sm font-bold">Atajos de Configuración de Alertas</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant">Umbral Bajo Stock (unidades)</label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant">Alerta de vencimiento (días)</label>
              <input
                type="number"
                min="1"
                value={dueAlertDays}
                onChange={(e) => setDueAlertDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-on-surface-variant">Meta mensual (USD)</label>
              <input
                type="number"
                min="100"
                step="50"
                value={monthlyGoalUsd}
                onChange={(e) => setMonthlyGoalUsd(Math.max(100, Number(e.target.value) || 100))}
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {isFormOpen && <ProductFormModal />}
    </div>
  );
}

function KpiCard({
  title,
  valuePrimary,
  valueSecondary,
  footer,
  icon,
  loading,
  progress,
  footerColor,
}: {
  title: string;
  valuePrimary: string;
  valueSecondary: string;
  footer: string;
  icon: React.ReactNode;
  loading: boolean;
  progress?: number;
  footerColor?: string;
}) {
  return (
    <article className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{title}</p>
        <span className="text-secondary">{icon}</span>
      </div>
      {loading ? (
        <div className="h-12 rounded-md bg-surface-container animate-pulse" />
      ) : (
        <>
          <p className="text-2xl font-manrope font-extrabold text-on-surface">{valuePrimary}</p>
          <p className="text-xs text-on-surface-variant">{valueSecondary}</p>
          {typeof progress === 'number' && (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-container" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">Progreso: {progress.toFixed(1)}%</p>
            </div>
          )}
          <p className={`text-[11px] mt-2 ${footerColor || 'text-on-surface-variant'}`}>{footer}</p>
        </>
      )}
    </article>
  );
}

function getUrgency(dueDate: string, dueAlertDays: number) {
  const today = toDayStart(new Date());
  const due = toDayStart(new Date(dueDate));
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Vencido', className: 'text-[#f44336]' };
  if (diffDays <= dueAlertDays) return { label: 'Vence hoy/manana', className: 'text-[#ff9800]' };
  return { label: 'Proxima semana', className: 'text-[#4caf50]' };
}

async function loadGastos(workspaceId: string) {
  const { data, error } = await supabase.from('gastos').select('*').eq('workspace_id', workspaceId);
  if (error || !data) return 0;

  return data.reduce((sum, row) => {
    const record = row as Record<string, unknown>;
    const amount = getByKeys(record, ['monto_usd', 'total_usd', 'monto', 'total']);
    return sum + asNumber(amount);
  }, 0);
}

async function loadPayables(workspaceId: string): Promise<PayableItem[]> {
  const tableCandidates = ['cuentas_por_pagar', 'facturas_por_pagar'];
  for (const table of tableCandidates) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(20)
      .order('fecha_vencimiento', { ascending: true });

    if (error || !data) {
      continue;
    }

    return data
      .map((row, index) => {
        const record = row as Record<string, unknown>;
        const id = String(getByKeys(record, ['id']) || `${table}-${index}`);
        const label = String(getByKeys(record, ['proveedor', 'nombre', 'descripcion', 'servicio']) || 'Factura sin etiqueta');
        const amountUsd = asNumber(getByKeys(record, ['monto_usd', 'total_usd', 'monto', 'total']));
        const dueDateRaw = getByKeys(record, ['fecha_vencimiento', 'vence_en', 'due_date', 'vencimiento']);
        const dueDate = dueDateRaw ? String(dueDateRaw) : new Date().toISOString();
        return { id, label, amountUsd, dueDate };
      })
      .filter((item) => item.amountUsd > 0);
  }

  return [];
}

function readDashboardNumber(key: string, fallback: number, minValue: number) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const saved = Number(window.localStorage.getItem(key) || String(fallback));
  if (!Number.isFinite(saved) || saved < minValue) {
    return fallback;
  }

  return saved;
}