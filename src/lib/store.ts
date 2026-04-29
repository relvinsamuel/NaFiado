import { create } from 'zustand';
import { supabase } from './supabase';
import { useCurrencyStore } from './currencyStore';

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
  total_bs: number;
  tasa_bcv: number;
  metodo_pago: string;
  items_count: number;
  created_at: string;
}

interface CheckoutRpcResult {
  id: string;
  total: number;
  total_bs: number;
  tasa_bcv: number;
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
  processCheckout: (metodoPago: string, clienteId: string, clienteNombre: string) => Promise<boolean>;
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
      const available = product.stock ?? 0;
      if (available <= 0) return state;

      const existing = state.cart.find((item) => item.codigo === product.codigo);
      if (existing) {
        if (existing.quantity >= available) return state;
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
        item.codigo === codigo
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock ?? quantity)) }
          : item
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

  processCheckout: async (metodoPago, clienteId, clienteNombre) => {
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

      const tasaBcv = useCurrencyStore.getState().bcvRate;

      const { data: ventaRaw, error: checkoutError } = await supabase.rpc('process_checkout_tx', {
        p_workspace_id: workspaceId,
        p_cajero_id: user.id,
        p_cliente_id: clienteId,
        p_cliente_nombre: clienteNombre,
        p_metodo_pago: metodoPago,
        p_tasa_bcv: tasaBcv,
        p_items: cart.map((item) => ({
          codigo: item.codigo,
          cantidad: item.quantity,
        })),
      });

      if (checkoutError) {
        throw checkoutError;
      }

      const venta = ventaRaw as CheckoutRpcResult | null;
      if (!venta) {
        throw new Error('No se recibio respuesta del checkout transaccional.');
      }

      set({
        lastVenta: {
          id: venta.id,
          total: Number(venta.total),
          total_bs: Number(venta.total_bs),
          tasa_bcv: Number(venta.tasa_bcv),
          metodo_pago: venta.metodo_pago,
          items_count: Number(venta.items_count),
          created_at: venta.created_at,
        },
        showSuccessModal: true,
        cart: [],
        isCheckingOut: false,
      });

      get().fetchInventory();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido en checkout';
      console.error('Error en checkout:', error);
      alert(`No se pudo completar la venta: ${message}`);
      set({ isCheckingOut: false });
      return false;
    }
  },

  closeSuccessModal: () => set({ showSuccessModal: false, lastVenta: null }),
}));
