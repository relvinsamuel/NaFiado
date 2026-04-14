'use client';

import { InventoryProduct, useInventoryStore } from '@/lib/inventoryStore';
import { Edit3, Trash2, AlertTriangle, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

type SortKey = 'nombre' | 'precio_usd' | 'stock' | 'categoria';
type SortDir = 'asc' | 'desc';

const LOW_STOCK_THRESHOLD = 3;

export default function InventoryTable({ products }: { products: InventoryProduct[] }) {
  const { openEditProduct, deleteProduct } = useInventoryStore();
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...products].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'string') return aVal.localeCompare(bVal as string) * dir;
    return ((aVal as number) - (bVal as number)) * dir;
  });

  const handleDelete = async (product: InventoryProduct) => {
    if (!confirm(`¿Eliminar "${product.nombre}" del inventario?`)) return;
    setDeletingId(product.codigo);
    await deleteProduct(product.codigo, product.workspace_id);
    setDeletingId(null);
  };

  const renderSortIcon = (column: SortKey) => {
    if (sortKey !== column) return <div className="w-4" />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const stockBadge = (stock: number | null) => {
    const s = stock ?? 0;
    if (s === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f44336]/10 text-[#f44336]">
          <XCircle size={12} /> Agotado
        </span>
      );
    }
    if (s <= LOW_STOCK_THRESHOLD) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ff9800]/10 text-[#ff9800]">
          <AlertTriangle size={12} /> {s} uds
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#4caf50]/10 text-[#4caf50]">
        {s} uds
      </span>
    );
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-surface-container-lowest rounded-lg text-on-surface-variant">
        <p className="font-medium">No se encontraron productos</p>
        <p className="text-xs mt-1">Prueba con otros filtros o agrega un nuevo producto.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-ambient">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('nombre')}>
                <div className="flex items-center gap-1">Producto {renderSortIcon('nombre')}</div>
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Código
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('categoria')}>
                <div className="flex items-center gap-1">Categoría {renderSortIcon('categoria')}</div>
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Costo Unit.
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Margen %
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('precio_usd')}>
                <div className="flex items-center justify-end gap-1">Precio USD {renderSortIcon('precio_usd')}</div>
              </th>
              <th className="text-center px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant cursor-pointer select-none hover:text-primary transition-colors" onClick={() => handleSort('stock')}>
                <div className="flex items-center justify-center gap-1">Stock {renderSortIcon('stock')}</div>
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product) => {
              const isLow = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= LOW_STOCK_THRESHOLD;
              const isOut = (product.stock ?? 0) === 0;
              return (
                <tr
                  key={`${product.codigo}-${product.workspace_id}`}
                  className={`transition-colors group
                    ${isOut ? 'bg-[#f44336]/[0.03]' : isLow ? 'bg-[#ff9800]/[0.03]' : ''}
                    hover:bg-surface-container`}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-on-surface font-manrope line-clamp-1">{product.nombre}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                      {product.codigo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold text-secondary bg-secondary-container px-2.5 py-1 rounded-full">
                      {product.categoria || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-on-surface-variant">
                    {product.costo_unitario != null ? `$${Number(product.costo_unitario).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-on-surface-variant">
                    {product.margen_detal != null ? `${Number(product.margen_detal).toFixed(0)}%` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-bold text-primary font-inter">
                      ${Number(product.precio_usd ?? 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {stockBadge(product.stock)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditProduct(product)}
                        className="p-2 rounded-md text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.codigo}
                        className="p-2 rounded-md text-outline hover:text-[#f44336] hover:bg-[#f44336]/10 transition-colors disabled:opacity-30"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Footer con conteo */}
      <div className="px-5 py-3 bg-surface-container-low text-xs text-on-surface-variant font-medium">
        Mostrando {sorted.length} de {products.length} productos
      </div>
    </div>
  );
}
