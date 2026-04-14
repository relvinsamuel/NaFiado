'use client';

import { useEffect } from 'react';
import { Search, Plus, Package, AlertTriangle, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import { useInventoryStore, StockFilter } from '@/lib/inventoryStore';
import InventoryTable from '@/components/inventory/InventoryTable';
import ProductFormModal from '@/components/inventory/ProductFormModal';

const STOCK_FILTERS: { id: StockFilter; label: string; icon: React.ElementType; colorClass: string }[] = [
  { id: 'all',     label: 'Todos',     icon: Package,        colorClass: 'text-on-surface' },
  { id: 'healthy', label: 'Disponible', icon: TrendingUp,     colorClass: 'text-[#4caf50]' },
  { id: 'low',     label: 'Stock Bajo', icon: AlertTriangle,  colorClass: 'text-[#ff9800]' },
  { id: 'out',     label: 'Agotado',   icon: XCircle,        colorClass: 'text-[#f44336]' },
];

export default function InventoryPage() {
  const {
    isLoading,
    searchQuery,
    setSearchQuery,
    stockFilter,
    setStockFilter,
    fetchProducts,
    openNewProduct,
    isFormOpen,
    stockStats,
    filteredProducts,
  } = useInventoryStore();

  const stats = stockStats();
  const filtered = filteredProducts();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="flex flex-col h-full w-full bg-surface-container-low">
      {/* Header */}
      <header className="shrink-0 bg-surface px-8 py-6 shadow-ambient z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-manrope font-extrabold text-on-surface">Inventario</h1>
            <p className="text-sm font-inter text-on-surface-variant mt-1">
              Gestión completa del catálogo de productos
            </p>
          </div>
          <button
            onClick={openNewProduct}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-3 px-5 hover:shadow-lg transition-all active:scale-[0.98] text-sm"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">
              <Package size={14} />
              Total SKUs
            </div>
            <p className="text-2xl font-manrope font-extrabold text-on-surface">{stats.total}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-2">
              <TrendingUp size={14} />
              Disponible
            </div>
            <p className="text-2xl font-manrope font-extrabold text-on-surface">{stats.healthy}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-[#ff9800] text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle size={14} />
              Stock Bajo
            </div>
            <p className="text-2xl font-manrope font-extrabold text-[#ff9800]">{stats.low}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 shadow-ambient">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">
              <DollarSign size={14} />
              Valor Total
            </div>
            <p className="text-2xl font-manrope font-extrabold text-primary">${stats.totalValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-md pl-10 pr-4 py-2.5 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto">
            {STOCK_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setStockFilter(f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                  ${stockFilter === f.id
                    ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
              >
                <f.icon size={14} />
                {f.label}
                {f.id === 'low' && stats.low > 0 && (
                  <span className="bg-[#ff9800] text-white text-[10px] rounded-full px-1.5">{stats.low}</span>
                )}
                {f.id === 'out' && stats.out > 0 && (
                  <span className="bg-[#f44336] text-white text-[10px] rounded-full px-1.5">{stats.out}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tabla de Inventario */}
      <div className="flex-1 overflow-auto p-4 md:px-8 md:py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
            <div className="w-8 h-8 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm">Cargando inventario...</p>
          </div>
        ) : (
          <InventoryTable products={filtered} />
        )}
      </div>

      {/* Modal de Producto */}
      {isFormOpen && <ProductFormModal />}
    </div>
  );
}
