import { create } from 'zustand';
import { supabase } from './supabase';

export interface Product {
  codigo: string;
  nombre: string;
  precio_usd: number;
  categoria?: string;
  stock?: number;
  workspace_id?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface VentaResult {
  id: string;
  total: number;
  metodo_pago: string;
  items_count: number;
  created_at: string;
}

interface PosStore {
  cart: CartItem[];
  inventory: Product[];
  isLoading: boolean;
  isCheckingOut: boolean;
  lastVenta: VentaResult | null;
  showSuccessModal: boolean;
  workspaceId: string | null;

  addToCart: (product: Product) => void;
  removeFromCart: (codigo: string) => void;
  updateQuantity: (codigo: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  fetchInventory: () => Promise<void>;
  fetchWorkspaceId: () => Promise<string | null>;
  processCheckout: (metodoPago: string, clienteNombre?: string) => Promise<boolean>;
  closeSuccessModal: () => void;
}

export const usePosStore = create<PosStore>((set, get) => ({
  cart: [],
  inventory: [],
  isLoading: false,
  isCheckingOut: false,
  lastVenta: null,
  showSuccessModal: false,
  workspaceId: null,

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item.codigo === product.codigo);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.codigo === product.codigo ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    }),

  removeFromCart: (codigo) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.codigo !== codigo),
    })),

  updateQuantity: (codigo, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.codigo === codigo ? { ...item, quantity: Math.max(1, quantity) } : item
      ),
    })),

  clearCart: () => set({ cart: [] }),

  cartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + Number(item.precio_usd) * item.quantity, 0);
  },

  fetchWorkspaceId: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      set({ workspaceId: null });
      return null;
    }

    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Error fetching workspace_id:', error);
      set({ workspaceId: null });
      return null;
    }

    set({ workspaceId: data.workspace_id });
    return data.workspace_id;
  },

  fetchInventory: async () => {
    set({ isLoading: true });

    let workspaceId = get().workspaceId;
    if (!workspaceId) {
      workspaceId = await get().fetchWorkspaceId();
    }

    let query = supabase
      .from('inventario')
      .select('codigo, nombre, precio_usd, categoria, stock, workspace_id')
      .order('nombre', { ascending: true });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching inventory:', error);
      set({ isLoading: false });
      return;
    }

    set({ inventory: data || [], isLoading: false });
  },

  processCheckout: async (metodoPago, clienteNombre) => {
    const { cart } = get();
    if (cart.length === 0) return false;

    let workspaceId = get().workspaceId;
    if (!workspaceId) {
      workspaceId = await get().fetchWorkspaceId();
    }
    if (!workspaceId) return false;

    set({ isCheckingOut: true });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesion activa');

      const total = get().cartTotal();

      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          workspace_id: workspaceId,
          cajero_id: user.id,
          cliente_nombre: clienteNombre || null,
          subtotal: total,
          impuesto: 0,
          total,
          metodo_pago: metodoPago,
        })
        .select('id, total, metodo_pago, created_at')
        .single();

      if (ventaError) throw ventaError;

      const detalles = cart.map((item) => ({
        venta_id: venta.id,
        workspace_id: workspaceId,
        producto_codigo: item.codigo,
        producto_nombre: item.nombre,
        precio_unitario: Number(item.precio_usd),
        cantidad: item.quantity,
        subtotal_linea: Number(item.precio_usd) * item.quantity,
      }));

      const { error: detallesError } = await supabase.from('venta_detalles').insert(detalles);
      if (detallesError) throw detallesError;

      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('inventario')
          .update({ stock: Math.max(0, (item.stock || 0) - item.quantity) })
          .eq('codigo', item.codigo)
          .eq('workspace_id', workspaceId);

        if (stockError) console.error('Error actualizando stock:', stockError);
      }

      set({
        lastVenta: {
          id: venta.id,
          total: venta.total,
          metodo_pago: venta.metodo_pago,
          items_count: cart.reduce((a, b) => a + b.quantity, 0),
          created_at: venta.created_at,
        },
        showSuccessModal: true,
        cart: [],
        isCheckingOut: false,
      });

      get().fetchInventory();
      return true;
    } catch (error) {
      console.error('Error en checkout:', error);
      set({ isCheckingOut: false });
      return false;
    }
  },

  closeSuccessModal: () => set({ showSuccessModal: false, lastVenta: null }),
}));
