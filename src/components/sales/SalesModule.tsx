"use client";
import React from 'react';
import SalesHeader from './SalesHeader';
import SalesHistory from './SalesHistory';
import SalesAudit from './SalesAudit';
import SalesMetrics from './SalesMetrics';

export default function SalesModule() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 md:px-6 py-6">
      <SalesHeader />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <SalesHistory />
        </div>
        <div className="flex flex-col gap-6">
          <SalesAudit />
          <SalesMetrics />
        </div>
      </div>
    </div>
  );
}
// Archivo eliminado
