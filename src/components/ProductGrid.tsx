'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePosStore } from '@/lib/store';
import { PackageOpen } from 'lucide-react';

export default function ProductGrid({ searchQuery }: { searchQuery: string }) {
  const { inventory, isLoading, fetchInventory, addToCart } = usePosStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const product of inventory) {
      if (product.categoria && product.categoria.trim()) {
        unique.add(product.categoria.trim());
      }
    }
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [inventory]);

  const filteredProducts = inventory.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      p.nombre.toLowerCase().includes(query) ||
      (p.categoria && p.categoria.toLowerCase().includes(query)) ||
      p.codigo.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === 'all' || (p.categoria || '').trim() === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-secondary">
        <div className="w-8 h-8 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="font-inter text-sm">Sincronizando inventario...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          const label = category === 'all' ? 'Todos' : category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm transition-colors cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold shadow-sm hover:shadow-md transition-shadow'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <div 
            key={product.codigo}
            onClick={() => addToCart(product)}
            className="bg-surface-container-lowest rounded-md overflow-hidden cursor-pointer group hover:-translate-y-1 hover:shadow-ambient transition-all duration-300"
          >
            <div className="h-40 bg-surface-container-low flex items-center justify-center p-4 relative overflow-hidden group-hover:bg-surface-container transition-colors">
                {/* Product placeholder */}
                <div className="w-24 h-24 bg-surface-container-highest rounded-full shadow-inner z-0 flex items-center justify-center text-center p-2 relative">
                    <PackageOpen size={32} className="text-outline-variant" />
                </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm text-on-surface mb-1 line-clamp-2 h-10 font-manrope">{product.nombre}</h3>
              <div className="flex items-center justify-between mt-3">
                <p className="text-primary font-bold font-inter">${Number(product.precio_usd).toFixed(2)}</p>
                <span className="text-[10px] text-on-secondary-container bg-secondary-container px-2 py-0.5 rounded-full font-semibold">Stock: {product.stock || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredProducts.length === 0 && !isLoading && (
         <div className="w-full h-40 flex items-center justify-center text-on-surface-variant font-inter bg-surface-container-lowest rounded-md border border-outline-variant/10 border-dashed mt-4">
             No se encontraron productos en el catálogo activo.
         </div>
      )}
    </div>
  );
}
