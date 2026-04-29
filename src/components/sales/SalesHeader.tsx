"use client";

import { useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Search } from 'lucide-react';
import type { SalesPeriod } from './types';

interface SalesHeaderProps {
  searchQuery: string;
  period: SalesPeriod;
  onSearchChange: (value: string) => void;
  onPeriodChange: (value: SalesPeriod) => void;
  onExport: (format: 'excel' | 'pdf') => void;
  isExporting: 'excel' | 'pdf' | null;
  canExport: boolean;
}

const PERIOD_LABELS: Record<SalesPeriod, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
};

export default function SalesHeader({
  searchQuery,
  period,
  onSearchChange,
  onPeriodChange,
  onExport,
  isExporting,
  canExport,
}: SalesHeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  function handleExport(format: 'excel' | 'pdf') {
    setShowExportMenu(false);
    onExport(format);
  }

  return (
    <header className="rounded-3xl border border-surface-container bg-surface px-4 py-4 shadow-sm md:px-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-end">
          <div className="relative w-full sm:w-auto sm:min-w-[220px]">
            <button
              type="button"
              onClick={() => setShowExportMenu((value) => !value)}
              disabled={!canExport || isExporting !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
              {isExporting ? 'Generando reporte...' : 'Exportar'}
              <ChevronDown size={16} />
            </button>

            {showExportMenu && !isExporting ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-2xl border border-surface-container-high bg-surface p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => handleExport('excel')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-on-surface transition-colors hover:bg-surface-container"
                >
                  <FileSpreadsheet size={16} />
                  Exportar como Excel
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-on-surface transition-colors hover:bg-surface-container"
                >
                  <FileText size={16} />
                  Exportar como PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 rounded-2xl border border-surface-container-high bg-surface-container-low px-4 py-3">
            <Search size={18} className="shrink-0 text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar cliente, codigo de producto o ticket"
              className="w-full border-0 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
            />
          </div>
        </div>

          </div>

          <div className="flex flex-col gap-2 lg:w-[320px]">
          <label className="flex flex-col gap-2 text-sm text-on-surface">
            <span className="font-medium">Filtrar</span>
            <div className="relative">
              <select
                value={period}
                onChange={(event) => onPeriodChange(event.target.value as SalesPeriod)}
                className="w-full appearance-none rounded-2xl border border-surface-container-high bg-surface-container-low px-4 py-3 pr-10 text-sm text-on-surface outline-none"
              >
                {(['today', 'week', 'month'] as SalesPeriod[]).map((option) => (
                  <option key={option} value={option}>
                    {PERIOD_LABELS[option]}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary" />
            </div>
          </label>
        </div>
      </div>
    </header>
  );
}
