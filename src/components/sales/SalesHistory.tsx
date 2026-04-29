"use client";

import type { SaleRecord } from './types';

interface SalesHistoryProps {
  sales: SaleRecord[];
  isLoading: boolean;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function SalesHistory({ sales, isLoading }: SalesHistoryProps) {
  return (
    <section className="rounded-3xl border border-surface-container bg-surface px-4 py-4 shadow-sm md:px-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">Historial de ventas</h2>
          <p className="text-sm text-on-surface-variant">La tabla responde al buscador y al periodo sin recargar la pantalla.</p>
        </div>
        <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
          {sales.length} tickets visibles
        </span>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-variant">
          Cargando ventas...
        </div>
      ) : sales.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-container-high px-4 py-10 text-center text-sm text-on-surface-variant">
          No hay ventas que coincidan con el filtro actual.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-on-surface-variant">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Hora</th>
                <th className="px-3 py-2 font-medium">Ticket</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Cajero</th>
                <th className="px-3 py-2 font-medium">Metodo</th>
                <th className="px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="rounded-2xl bg-surface-container-lowest text-on-surface shadow-sm">
                  <td className="rounded-l-2xl px-3 py-3">{formatDate(sale.createdAt)}</td>
                  <td className="px-3 py-3">{formatTime(sale.createdAt)}</td>
                  <td className="px-3 py-3 font-medium">{sale.ticketNumber}</td>
                  <td className="px-3 py-3">{sale.clientName}</td>
                  <td className="px-3 py-3">{sale.cashierName}</td>
                  <td className="px-3 py-3">{sale.paymentMethod}</td>
                  <td className="rounded-r-2xl px-3 py-3 font-semibold">{formatCurrency(sale.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
