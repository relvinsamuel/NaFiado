"use client";

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SalesHeader from './SalesHeader';
import SalesHistory from './SalesHistory';
import type { SaleRecord, SalesExportRow, SalesPeriod } from './types';

type VentaRow = {
  id: string;
  cliente_nombre: string | null;
  metodo_pago: string | null;
  total: number | string | null;
  created_at: string | null;
  cajero_id?: string | null;
  referencia_transferencia?: string | null;
  venta_detalles?: Array<{
    producto_codigo?: string | null;
    producto_nombre?: string | null;
    cantidad?: number | null;
  }> | null;
};

const PERIOD_LABELS: Record<SalesPeriod, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
};

function startOfPeriod(period: SalesPeriod) {
  const now = new Date();

  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (period === 'week') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function normalizePaymentMethod(value: string | null | undefined) {
  if (!value) return 'Sin especificar';
  return value
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function buildTicketNumber(id: string) {
  return `V-${id.slice(0, 8).toUpperCase()}`;
}

function buildCashierName(cashierId?: string | null) {
  if (!cashierId) return 'Caja principal';
  return `Cajero ${cashierId.slice(0, 6)}`;
}

function toSaleRecord(row: VentaRow): SaleRecord | null {
  if (!row.id || !row.created_at) {
    return null;
  }

  const details = Array.isArray(row.venta_detalles) ? row.venta_detalles : [];

  return {
    id: row.id,
    ticketNumber: buildTicketNumber(row.id),
    clientName: row.cliente_nombre?.trim() || 'Consumidor final',
    cashierName: buildCashierName(row.cajero_id),
    paymentMethod: normalizePaymentMethod(row.metodo_pago),
    transferReference: row.referencia_transferencia?.trim() || '',
    total: Number(row.total ?? 0),
    createdAt: row.created_at,
    productCodes: details.map((detail) => detail.producto_codigo?.trim() || '').filter(Boolean),
    items: details.map((detail) => ({
      code: detail.producto_codigo?.trim() || 'SIN-CODIGO',
      name: detail.producto_nombre?.trim() || 'Producto sin nombre',
      quantity: Number(detail.cantidad ?? 0),
    })),
  };
}

function toExportRow(sale: SaleRecord): SalesExportRow {
  const date = new Date(sale.createdAt);
  return {
    fecha: new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date),
    hora: new Intl.DateTimeFormat('es-VE', { hour: '2-digit', minute: '2-digit' }).format(date),
    ticket: sale.ticketNumber,
    cliente: sale.clientName,
    cajero: sale.cashierName,
    metodoPago: sale.paymentMethod,
    referencia: sale.transferReference || '-',
    total: sale.total.toFixed(2),
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<SalesPeriod>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSales() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) {
          setSales([]);
          setIsLoading(false);
        }
        return;
      }

      const workspaceResponse = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (workspaceResponse.error || !workspaceResponse.data?.workspace_id) {
        if (active) {
          setSales([]);
          setIsLoading(false);
        }
        return;
      }

      const salesResponse = await supabase
        .from('ventas')
        .select('id, cliente_nombre, metodo_pago, total, created_at, cajero_id, referencia_transferencia, venta_detalles(producto_codigo, producto_nombre, cantidad)')
        .eq('workspace_id', workspaceResponse.data.workspace_id)
        .order('created_at', { ascending: false })
        .limit(150);

      if (salesResponse.error) {
        console.error('Error fetching sales:', salesResponse.error);
        if (active) {
          setSales([]);
          setIsLoading(false);
        }
        return;
      }

      if (!active) return;

      const parsedSales = (salesResponse.data as VentaRow[])
        .map(toSaleRecord)
        .filter((sale): sale is SaleRecord => sale !== null);

      setSales(parsedSales);
      setIsLoading(false);
    }

    void loadSales();

    return () => {
      active = false;
    };
  }, []);

  const filteredSales = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const periodStart = startOfPeriod(period).getTime();

    return sales.filter((sale) => {
      const createdAt = new Date(sale.createdAt).getTime();
      if (createdAt < periodStart) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        sale.clientName,
        sale.ticketNumber,
        sale.transferReference,
        sale.paymentMethod,
        ...sale.productCodes,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [period, sales, searchQuery]);

  async function handleExport(format: 'excel' | 'pdf') {
    if (filteredSales.length === 0 || isExporting) {
      return;
    }

    try {
      setIsExporting(format);

      const response = await fetch('/api/sales/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          periodLabel: PERIOD_LABELS[period],
          rows: filteredSales.map(toExportRow),
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo generar la exportacion.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const extension = format === 'excel' ? 'csv' : 'pdf';

      anchor.href = url;
      anchor.download = `ventas-${period}-${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('No se pudo exportar el reporte.');
    } finally {
      setIsExporting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-2 md:px-6 py-6">
      <SalesHeader
        searchQuery={searchQuery}
        period={period}
        onSearchChange={setSearchQuery}
        onPeriodChange={setPeriod}
        onExport={handleExport}
        isExporting={isExporting}
        canExport={filteredSales.length > 0}
      />
      <SalesHistory sales={filteredSales} isLoading={isLoading} />
    </div>
  );
}
