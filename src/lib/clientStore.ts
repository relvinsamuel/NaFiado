import { create } from 'zustand';
import { supabase } from './supabase';
import { bsToUsd, normalizeRate, usdToBs } from './currency';

export interface Client {
  id: string;
  workspace_id: string;
  nombre: string;
  telefono: string | null;
  cedula: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  created_at: string | null;
}

export interface ClientVenta {
  id: string;
  total: number;
  total_bs: number;
  tasa_bcv: number;
  metodo_pago: string;
  cliente_nombre: string | null;
  created_at: string;
}

export interface Abono {
  id: string;
  workspace_id: string;
  cliente_id: string;
  monto_usd: number;
  monto_bs: number;
  tasa_bcv: number;
  moneda_pago: string;
  metodo_pago: string;
  nota: string | null;
  created_at: string;
}

export interface ClientBalance {
  totalCompras: number;
  totalFiado: number;
  totalAbonos: number;
  saldoPendiente: number;
}

interface ClientStore {
  clients: Client[];
  isLoading: boolean;
  isSaving: boolean;
  workspaceId: string | null;
  searchQuery: string;
  editingClient: Client | null;
  isFormOpen: boolean;
  isNewClient: boolean;

  // Detail view
  selectedClientId: string | null;
  clientVentas: ClientVenta[];
  clientAbonos: Abono[];
  clientBalance: ClientBalance;
  isLoadingDetail: boolean;

  setSearchQuery: (q: string) => void;
  openNewClient: () => void;
  openEditClient: (client: Client) => void;
  closeForm: () => void;

  fetchClients: () => Promise<void>;
  fetchWorkspaceId: () => Promise<string | null>;
  saveClient: (client: Partial<Client>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  filteredClients: () => Client[];

  // Detail & Fiado
  fetchClientDetail: (clientId: string) => Promise<void>;
  clearClientDetail: () => void;
  addAbono: (clientId: string, workspaceId: string, monto: number, monedaPago: string, metodoPago: string, tasaBcv: number, nota?: string) => Promise<boolean>;
  fetchBalances: () => Promise<Map<string, ClientBalance>>;
}

const emptyBalance: ClientBalance = { totalCompras: 0, totalFiado: 0, totalAbonos: 0, saldoPendiente: 0 };

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  isLoading: false,
  isSaving: false,
  workspaceId: null,
  searchQuery: '',
  editingClient: null,
  isFormOpen: false,
  isNewClient: false,

  selectedClientId: null,
  clientVentas: [],
  clientAbonos: [],
  clientBalance: { ...emptyBalance },
  isLoadingDetail: false,

  setSearchQuery: (q) => set({ searchQuery: q }),
  openNewClient: () => set({ isFormOpen: true, isNewClient: true, editingClient: null }),
  openEditClient: (client) => set({ isFormOpen: true, isNewClient: false, editingClient: client }),
  closeForm: () => set({ isFormOpen: false, editingClient: null, isNewClient: false }),

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

  fetchClients: async () => {
    set({ isLoading: true });

    let workspaceId = get().workspaceId;
    if (!workspaceId) {
      workspaceId = await get().fetchWorkspaceId();
    }
    if (!workspaceId) {
      set({ clients: [], isLoading: false });
      return;
    }

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      set({ isLoading: false });
      return;
    }
    set({ clients: data || [], isLoading: false });
  },

  saveClient: async (client) => {
    set({ isSaving: true });
    const isNew = get().isNewClient;

    let workspaceId = get().workspaceId;
    if (!workspaceId) {
      workspaceId = await get().fetchWorkspaceId();
    }
    if (!workspaceId) {
      set({ isSaving: false });
      alert('No se pudo resolver el workspace actual.');
      return null;
    }

    const payload = {
      workspace_id: client.workspace_id || workspaceId,
      nombre: client.nombre,
      telefono: client.telefono || null,
      cedula: client.cedula || null,
      email: client.email || null,
      direccion: client.direccion || null,
      notas: client.notas || null,
    };

    if (isNew) {
      const { data, error } = await supabase.from('clientes').insert(payload).select().single();
      if (error) {
        console.error('Error creating client:', error);
        alert(`Error al crear cliente: ${error.message}`);
        set({ isSaving: false });
        return null;
      }
      set({ isSaving: false });
      get().closeForm();
      await get().fetchClients();
      return data;
    } else {
      const { data, error } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', client.id)
        .eq('workspace_id', payload.workspace_id)
        .select()
        .single();
      if (error) {
        console.error('Error updating client:', error);
        alert(`Error al actualizar: ${error.message}`);
        set({ isSaving: false });
        return null;
      }
      set({ isSaving: false });
      get().closeForm();
      await get().fetchClients();
      return data;
    }
  },

  deleteClient: async (id) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) {
      console.error('Error deleting client:', error);
      return false;
    }
    await get().fetchClients();
    return true;
  },

  filteredClients: () => {
    const { clients, searchQuery } = get();
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.cedula && c.cedula.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  },

  fetchClientDetail: async (clientId: string) => {
    set({ isLoadingDetail: true, selectedClientId: clientId });

    let workspaceId = get().workspaceId;
    if (!workspaceId) {
      workspaceId = await get().fetchWorkspaceId();
    }
    if (!workspaceId) {
      set({
        clientVentas: [],
        clientAbonos: [],
        clientBalance: { ...emptyBalance },
        isLoadingDetail: false,
      });
      return;
    }

    const [ventasRes, abonosRes] = await Promise.all([
      supabase
        .from('ventas')
        .select('id, total, total_bs, tasa_bcv, metodo_pago, cliente_nombre, created_at')
        .eq('workspace_id', workspaceId)
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('abonos')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false }),
    ]);

    const ventas: ClientVenta[] = ventasRes.data || [];
    const abonos: Abono[] = abonosRes.data || [];

    const totalCompras = ventas.reduce((s, v) => s + Number(v.total), 0);
    const totalFiado = ventas
      .filter((v) => v.metodo_pago === 'fiado')
      .reduce((s, v) => s + Number(v.total), 0);
    const totalAbonos = abonos.reduce((s, a) => s + Number(a.monto_usd), 0);

    set({
      clientVentas: ventas,
      clientAbonos: abonos,
      clientBalance: {
        totalCompras,
        totalFiado,
        totalAbonos,
        saldoPendiente: totalFiado - totalAbonos,
      },
      isLoadingDetail: false,
    });
  },

  clearClientDetail: () =>
    set({
      selectedClientId: null,
      clientVentas: [],
      clientAbonos: [],
      clientBalance: { ...emptyBalance },
    }),

  addAbono: async (clientId, workspaceId, monto, monedaPago, metodoPago, tasaBcv, nota) => {
    let resolvedWorkspaceId = get().workspaceId;
    if (!resolvedWorkspaceId) {
      resolvedWorkspaceId = await get().fetchWorkspaceId();
    }
    const safeWorkspaceId = resolvedWorkspaceId || workspaceId;
    if (!safeWorkspaceId) {
      alert('No se pudo resolver el workspace actual.');
      return false;
    }

    const rate = normalizeRate(tasaBcv);
    const montoUsd = monedaPago === 'bs' ? bsToUsd(monto, rate) : monto;
    const montoBs = monedaPago === 'bs' ? monto : usdToBs(monto, rate);

    const { error } = await supabase.from('abonos').insert({
      workspace_id: safeWorkspaceId,
      cliente_id: clientId,
      monto: monto,
      monto_usd: montoUsd,
      monto_bs: montoBs,
      tasa_bcv: rate,
      moneda_pago: monedaPago,
      metodo_pago: metodoPago,
      nota: nota || null,
    });

    if (error) {
      console.error('Error adding abono:', error);
      alert(`Error al registrar abono: ${error.message}`);
      return false;
    }

    await get().fetchClientDetail(clientId);
    return true;
  },

  fetchBalances: async () => {
    const balanceMap = new Map<string, ClientBalance>();

    let workspaceId = get().workspaceId;
    if (!workspaceId) {
      workspaceId = await get().fetchWorkspaceId();
    }
    if (!workspaceId) {
      return balanceMap;
    }

    const [ventasRes, abonosRes] = await Promise.all([
      supabase
        .from('ventas')
        .select('cliente_id, total, metodo_pago')
        .eq('workspace_id', workspaceId)
        .not('cliente_id', 'is', null),
      supabase.from('abonos').select('cliente_id, monto_usd').eq('workspace_id', workspaceId),
    ]);

    for (const v of ventasRes.data || []) {
      const cid = v.cliente_id as string;
      if (!balanceMap.has(cid)) balanceMap.set(cid, { ...emptyBalance });
      const b = balanceMap.get(cid)!;
      b.totalCompras += Number(v.total);
      if (v.metodo_pago === 'fiado') b.totalFiado += Number(v.total);
    }

    for (const a of abonosRes.data || []) {
      const cid = a.cliente_id as string;
      if (!balanceMap.has(cid)) balanceMap.set(cid, { ...emptyBalance });
      balanceMap.get(cid)!.totalAbonos += Number(a.monto_usd);
    }

    for (const [, b] of balanceMap) {
      b.saldoPendiente = b.totalFiado - b.totalAbonos;
    }

    return balanceMap;
  },
}));
