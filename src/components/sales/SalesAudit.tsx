"use client";
import React from 'react';

export default function SalesAudit() {
  return (
    <section className="bg-base-100 rounded-xl shadow p-4">
      <h2 className="font-bold mb-2">Cierres de Caja</h2>
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          <span className="badge badge-success">🟢</span>
          <span>28/04/2026 - Juan (Perfecto)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="badge badge-warning">🟡</span>
          <span>27/04/2026 - Ana (Sobrante)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="badge badge-error">🔴</span>
          <span>26/04/2026 - Luis (Faltante)</span>
        </li>
      </ul>
    </section>
  );
}
// Archivo eliminado
