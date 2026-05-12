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
  sesion_caja_id?: string;
  total: number;
  total_bs: number;
  tasa_bcv: number;
  metodo_pago: string;
  items_count: number;
  created_at: string;
}

export interface CashSession {
  id: string;
  estado: 'abierta' | 'cerrada';
  monto_inicial: number;
  total_efectivo: number;
  total_ventas: number;
  diferencia_cierre?: number | null;
  fecha_apertura: string;
}

interface CheckoutRpcResult {
  id: string;
  sesion_caja_id?: string;
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
  cashSession: CashSession | null;
  isCashSessionLoading: boolean;

  addToCart: (product: Product) => void;
  removeFromCart: (codigo: string) => void;
  updateQuantity: (codigo: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  fetchInventory: () => Promise<void>;
  fetchWorkspaceId: () => Promise<string | null>;
  processCheckout: (metodoPago: string, clienteId: string, clienteNombre: string) => Promise<boolean>;
  closeSuccessModal: () => void;

  fetchCurrentSession: () => Promise<void>;
  openCashSession: (montoInicial: number) => Promise<boolean>;
  closeCashSession: (montoDeclarado: number) => Promise<boolean>;
}

export const usePosStore = create<PosStore>((set, get) => ({
  cart: [],
  inventory: [],
  isLoading: false,
  isCheckingOut: false,
  lastVenta: null,
  showSuccessModal: false,
  workspaceId: null,
  cashSession: null,
  isCashSessionLoading: false,

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
      .maybeSingle();

    if (error) {
      console.error('Error fetching workspace_id:', JSON.stringify(error, null, 2));
      set({ workspaceId: null });
      return null;
    }

    if (!data) {
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
        p_referencia_transferencia: '',
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
          sesion_caja_id: venta.sesion_caja_id,
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

  fetchCurrentSession: async () => {
    set({ isCashSessionLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isCashSessionLoading: false });
        return;
      }

      let workspaceId = get().workspaceId;
      if (!workspaceId) {
        workspaceId = await get().fetchWorkspaceId();
      }
      if (!workspaceId) {
        set({ isCashSessionLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('sesiones_caja')
        .select('*')
        .eq('tenant_id', workspaceId)
        .eq('usuario_id', user.id)
        .eq('estado', 'abierta')
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      set({ cashSession: data || null, isCashSessionLoading: false });
    } catch (err) {
      console.error('Error fetching cash session:', err);
      set({ cashSession: null, isCashSessionLoading: false });
    }
  },

  openCashSession: async (montoInicial: number) => {
    set({ isCashSessionLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let workspaceId = get().workspaceId;
      if (!workspaceId) {
        workspaceId = await get().fetchWorkspaceId();
      }
      if (!workspaceId) throw new Error('No se encontró el workspace del cajero. Por favor, verifica que tu usuario tenga un workspace asignado.');

      const { data, error } = await supabase.rpc('open_cash_session', {
        p_workspace_id: workspaceId,
        p_cajero_id: user.id,
        p_monto_apertura: montoInicial
      });

      if (error) throw error;
      
      set({ cashSession: data, isCashSessionLoading: false });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al abrir caja';
      alert(`No se pudo abrir la caja: ${message}`);
      set({ isCashSessionLoading: false });
      return false;
    }
  },

  closeCashSession: async (montoDeclarado: number) => {
    set({ isCashSessionLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let workspaceId = get().workspaceId;
      if (!workspaceId) {
        workspaceId = await get().fetchWorkspaceId();
      }
      if (!workspaceId) throw new Error('No se encontró el workspace del cajero.');

      const currentSession = get().cashSession;
      if (!currentSession) throw new Error('No hay caja abierta');

      const { data, error } = await supabase.rpc('close_cash_session', {
        p_workspace_id: workspaceId,
        p_sesion_caja_id: currentSession.id,
        p_cajero_id: user.id,
        p_monto_declarado_cierre: montoDeclarado
      });

      if (error) throw error;
      
      set({ cashSession: null, isCashSessionLoading: false });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cerrar caja';
      alert(`No se pudo cerrar la caja: ${message}`);
      set({ isCashSessionLoading: false });
      return false;
    }
  },
}));
