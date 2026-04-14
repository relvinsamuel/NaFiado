import { create } from 'zustand';
import { supabase } from './supabase';

export interface InventoryProduct {
  codigo: string;
  workspace_id: string;
  nombre: string;
  categoria: string | null;
  costo_unitario: number | null;
  margen_detal: number | null;
  precio_usd: number | null;
  stock: number | null;
  created_at: string | null;
}

export type StockFilter = 'all' | 'low' | 'out' | 'healthy';

interface InventoryStore {
  products: InventoryProduct[];
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  stockFilter: StockFilter;
  editingProduct: InventoryProduct | null;
  isFormOpen: boolean;
  isNewProduct: boolean;

  setSearchQuery: (q: string) => void;
  setStockFilter: (f: StockFilter) => void;
  openNewProduct: () => void;
  openEditProduct: (product: InventoryProduct) => void;
  closeForm: () => void;

  fetchProducts: () => Promise<void>;
  saveProduct: (product: Partial<InventoryProduct>) => Promise<boolean>;
  deleteProduct: (codigo: string, workspaceId: string) => Promise<boolean>;
  
  filteredProducts: () => InventoryProduct[];
  stockStats: () => { total: number; healthy: number; low: number; out: number; totalValue: number };
}

const LOW_STOCK_THRESHOLD = 3;

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  isLoading: false,
  isSaving: false,
  searchQuery: '',
  stockFilter: 'all',
  editingProduct: null,
  isFormOpen: false,
  isNewProduct: false,

  setSearchQuery: (q) => set({ searchQuery: q }),
  setStockFilter: (f) => set({ stockFilter: f }),

  openNewProduct: () => set({ isFormOpen: true, isNewProduct: true, editingProduct: null }),
  openEditProduct: (product) => set({ isFormOpen: true, isNewProduct: false, editingProduct: product }),
  closeForm: () => set({ isFormOpen: false, editingProduct: null, isNewProduct: false }),

  fetchProducts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      set({ isLoading: false });
      return;
    }
    set({ products: data || [], isLoading: false });
  },

  saveProduct: async (product) => {
    set({ isSaving: true });
    const isNew = get().isNewProduct;

    // Solo enviar columnas que existen en la tabla inventario
    const payload = {
      codigo: product.codigo,
      workspace_id: product.workspace_id,
      nombre: product.nombre,
      categoria: product.categoria || null,
      costo_unitario: product.costo_unitario ?? null,
      margen_detal: product.margen_detal ?? null,
      precio_usd: product.precio_usd ?? null,
      stock: product.stock ?? 0,
    };

    if (isNew) {
      console.log('Insertando producto:', JSON.stringify(payload));
      const { data, error, status, statusText } = await supabase.from('inventario').insert(payload).select();
      if (error) {
        console.error('Error creating product:', JSON.stringify(error), 'Status:', status, statusText);
        alert(`Error al crear: ${error.message || error.details || error.hint || 'Revisa la consola'}`);
        set({ isSaving: false });
        return false;
      }
      console.log('Producto creado:', data);
    } else {
      // Para update, sacamos las PKs del payload
      const { codigo, workspace_id, ...updates } = payload;
      const { error } = await supabase
        .from('inventario')
        .update(updates)
        .eq('codigo', codigo)
        .eq('workspace_id', workspace_id);
      if (error) {
        console.error('Error updating product:', JSON.stringify(error));
        alert(`Error al actualizar: ${error.message || 'Revisa la consola'}`);
        set({ isSaving: false });
        return false;
      }
    }

    set({ isSaving: false });
    get().closeForm();
    await get().fetchProducts();
    return true;
  },

  deleteProduct: async (codigo, workspaceId) => {
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('codigo', codigo)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }
    await get().fetchProducts();
    return true;
  },

  filteredProducts: () => {
    const { products, searchQuery, stockFilter } = get();

    let filtered = products;

    // Búsqueda por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.categoria && p.categoria.toLowerCase().includes(q))
      );
    }

    // Filtro por stock
    switch (stockFilter) {
      case 'out':
        filtered = filtered.filter(p => (p.stock ?? 0) === 0);
        break;
      case 'low':
        filtered = filtered.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD);
        break;
      case 'healthy':
        filtered = filtered.filter(p => (p.stock ?? 0) > LOW_STOCK_THRESHOLD);
        break;
    }

    return filtered;
  },

  stockStats: () => {
    const { products } = get();
    const total = products.length;
    const out = products.filter(p => (p.stock ?? 0) === 0).length;
    const low = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length;
    const healthy = total - out - low;
    const totalValue = products.reduce((sum, p) => sum + (Number(p.precio_usd) || 0) * (p.stock ?? 0), 0);
    return { total, healthy, low, out, totalValue };
  },
}));
