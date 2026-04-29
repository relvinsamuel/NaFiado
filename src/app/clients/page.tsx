'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { useClientStore, ClientBalance } from '@/lib/clientStore';
import ClientsTable from '@/components/clients/ClientsTable';
import ClientFormModal from '@/components/clients/ClientFormModal';
import { formatBs, formatUsd, usdToBs } from '@/lib/currency';
import { useCurrencyStore } from '@/lib/currencyStore';

export default function ClientsPage() {
  const { bcvRate } = useCurrencyStore();
  const {
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchClients,
    openNewClient,
    isFormOpen,
    filteredClients,
    clients,
    fetchBalances,
  } = useClientStore();

  const filtered = filteredClients();
  const [balances, setBalances] = useState<Map<string, ClientBalance>>(new Map());

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (clients.length > 0) {
      fetchBalances().then(setBalances);
    }
  }, [clients, fetchBalances]);

  const totalDeuda = Array.from(balances.values()).reduce((s, b) => s + Math.max(0, b.saldoPendiente), 0);
  const clientesConDeuda = Array.from(balances.values()).filter((b) => b.saldoPendiente > 0).length;

  return (
    <div className="flex flex-col h-full w-full bg-surface-container-low">
      {/* Header */}
      <header className="shrink-0 bg-surface px-8 py-6 shadow-ambient z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-manrope font-extrabold text-on-surface">Clientes</h1>
            <p className="text-sm font-inter text-on-surface-variant mt-1">
              Gestión de clientes y cuentas pendientes
            </p>
          </div>
          <button
            onClick={openNewClient}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-3 px-5 hover:shadow-lg transition-all active:scale-[0.98] text-sm"
          >
            <Plus size={18} />
            Nuevo Cliente
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">
              <Users size={14} />
              Total Clientes
            </div>
            <p className="text-2xl font-manrope font-extrabold text-on-surface">{clients.length}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-[#f44336] text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle size={14} />
              Deuda Total
            </div>
            <p className="text-2xl font-manrope font-extrabold text-[#f44336]">{formatBs(usdToBs(totalDeuda, bcvRate))}</p>
            <p className="text-[11px] text-on-surface-variant">{formatUsd(totalDeuda)}</p>
            <p className="text-[10px] text-on-surface-variant">{clientesConDeuda} clientes con saldo</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">
              <DollarSign size={14} />
              Ventas Totales
            </div>
            <p className="text-2xl font-manrope font-extrabold text-on-surface">
              {formatBs(usdToBs(Array.from(balances.values()).reduce((s, b) => s + b.totalCompras, 0), bcvRate))}
            </p>
            <p className="text-[11px] text-on-surface-variant">{formatUsd(Array.from(balances.values()).reduce((s, b) => s + b.totalCompras, 0))}</p>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md pl-10 pr-4 py-2.5 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
          />
        </div>
      </header>

      {/* Tabla */}
      <div className="flex-1 overflow-auto p-4 md:px-8 md:py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
            <div className="w-8 h-8 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm">Cargando clientes...</p>
          </div>
        ) : (
          <ClientsTable clients={filtered} balances={balances} />
        )}
      </div>

      {isFormOpen && <ClientFormModal />}
    </div>
  );
}
