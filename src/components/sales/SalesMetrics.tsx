"use client";
import React, { useState } from 'react';

export default function SalesMetrics() {
  const [showComparativas, setShowComparativas] = useState(false);
  return (
    <section className="bg-base-100 rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold">Métricas</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span>Ver Comparativas</span>
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={showComparativas}
            onChange={() => setShowComparativas(v => !v)}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="stat">
          <div className="stat-title">Ticket Promedio</div>
          <div className="stat-value">$120.00</div>
        </div>
        <div className="stat">
          <div className="stat-title">Top 5 Vendidos</div>
          <div className="stat-value">Producto A</div>
        </div>
      </div>
      <div className="mb-2">
        {/* Aquí irá el gráfico de barras */}
        <div className="bg-gray-200 h-16 rounded" />
      </div>
      {showComparativas && (
        <div className="mt-2">
          <div className="text-sm">Hoy vs. Ayer: <span className="text-green-600">↑ 15%</span></div>
          <div className="text-sm">Esta Semana vs. Semana Pasada: <span className="text-red-600">↓ 5%</span></div>
          <div className="text-sm">Este Mes vs. Mes Pasado: <span className="text-green-600">↑ 8%</span></div>
        </div>
      )}
    </section>
  );
}
// Archivo eliminado
