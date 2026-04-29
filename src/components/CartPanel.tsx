'use client';

import { useState, useEffect, useRef } from 'react';
import { usePosStore } from '@/lib/store';
import { useClientStore, Client } from '@/lib/clientStore';
import { Trash2, Plus, Minus, CreditCard, User, ShoppingBag, ChevronDown, X, ReceiptText, Search, UserPlus } from 'lucide-react';
import { formatBs, formatUsd, usdToBs } from '@/lib/currency';
import { useCurrencyStore } from '@/lib/currencyStore';

const METODOS_PAGO = [
  { id: 'efectivo_usd', label: '💵 Efectivo USD' },
  { id: 'efectivo_bs',  label: '🇻🇪 Efectivo Bs' },
  { id: 'pago_movil',   label: '📱 Pago Móvil' },
  { id: 'zelle',        label: '💳 Zelle' },
  { id: 'punto',        label: '💳 Punto de Venta' },
  { id: 'fiado',        label: '📋 Fiado (Crédito)' },
];

export default function CartPanel() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, processCheckout, isCheckingOut } = usePosStore();
  const { clients, fetchClients } = useClientStore();
  const { bcvRate } = useCurrencyStore();
  const total = cartTotal();
  const totalBs = usdToBs(total, bcvRate);
  const [metodoPago, setMetodoPago] = useState('efectivo_usd');
  const [showMetodos, setShowMetodos] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Client selector state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [creatingSaving, setCreatingSaving] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return c.nombre.toLowerCase().includes(q) || (c.cedula && c.cedula.toLowerCase().includes(q)) || (c.telefono && c.telefono.includes(q));
  });

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const handleQuickCreate = async () => {
    if (!quickName.trim()) return;
    setCreatingSaving(true);
    const { saveClient, fetchClients: refresh } = useClientStore.getState();
    // Get workspace_id from POS store
    let wsId = usePosStore.getState().workspaceId;
    if (!wsId) {
      wsId = await usePosStore.getState().fetchWorkspaceId();
    }
    if (!wsId) {
      alert('No se pudo resolver el workspace');
      setCreatingSaving(false);
      return;
    }
    useClientStore.setState({ isNewClient: true });
    const created = await saveClient({
      workspace_id: wsId,
      nombre: quickName.trim(),
      telefono: quickPhone.trim() || null,
    });
    if (created) {
      setSelectedClient(created);
      await refresh();
    }
    setQuickName('');
    setQuickPhone('');
    setShowQuickCreate(false);
    setCreatingSaving(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;
    if (!selectedClient) {
      alert('Debes seleccionar un cliente para facturar.');
      return;
    }

    const ok = await processCheckout(metodoPago, selectedClient.id, selectedClient.nombre);
    if (ok) {
      setSelectedClient(null);
      setMobileOpen(false);
    }
  };

  const metodoActual = METODOS_PAGO.find(m => m.id === metodoPago)!;

  return (
    <>
      {mobileOpen && (
        <button
          className="md:hidden fixed inset-0 bg-on-surface/30 backdrop-blur-[1px] z-30"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar carrito"
        />
      )}

      <button
        className="md:hidden fixed bottom-4 right-4 z-40 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full px-4 py-3 shadow-ambient flex items-center gap-2 font-bold"
        onClick={() => setMobileOpen(true)}
      >
        <ReceiptText size={16} />
        Carrito ({cart.reduce((a, b) => a + b.quantity, 0)})
      </button>

      <aside className={`w-full md:w-[400px] bg-surface flex flex-col h-full shrink-0 z-40 fixed md:relative right-0 bottom-0 top-0 transition-transform shadow-[-10px_0_30px_rgba(26,28,28,0.03)] ${mobileOpen ? 'translate-y-0' : 'translate-y-full'} md:translate-y-0`}>
      {/* Header Carrito */}
      <div className="h-20 px-6 flex items-center justify-between shrink-0 bg-surface-container-lowest z-10 shadow-[0_4px_20px_rgba(26,28,28,0.02)]">
        <h2 className="text-xl font-bold font-manrope text-on-surface flex items-center gap-3">
          Facturación
          <span className="bg-primary text-on-primary text-xs rounded-full px-2.5 py-0.5 font-bold">
            {cart.reduce((a, b) => a + b.quantity, 0)}
          </span>
        </h2>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-secondary hover:text-primary transition-colors text-sm font-semibold">
            Limpiar
          </button>
        )}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-on-surface-variant hover:text-on-surface"
          aria-label="Cerrar panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Selector de Cliente (obligatorio) */}
      <div className="p-5 bg-surface shrink-0 space-y-2" ref={clientRef}>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
          <User size={14} />
          Cliente *
        </label>

        {selectedClient ? (
          <div className="flex items-center justify-between bg-secondary-container rounded-md p-3">
            <div>
              <p className="text-sm font-bold text-on-surface">{selectedClient.nombre}</p>
              {selectedClient.cedula && <p className="text-xs text-on-surface-variant">{selectedClient.cedula}</p>}
            </div>
            <button onClick={() => setSelectedClient(null)} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Buscar cliente..."
                className="w-full bg-surface-container-low rounded-md pl-9 pr-3 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {showClientDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-md shadow-[0_4px_30px_rgba(26,28,28,0.12)] overflow-hidden z-20 max-h-48 overflow-y-auto">
                {filteredClients.length > 0 ? (
                  filteredClients.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectClient(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium text-on-surface">{c.nombre}</span>
                      {c.cedula && <span className="text-xs text-on-surface-variant">{c.cedula}</span>}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-xs text-on-surface-variant">Sin resultados</p>
                )}
                <button
                  onClick={() => { setShowClientDropdown(false); setShowQuickCreate(true); setQuickName(clientSearch); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface-container transition-colors flex items-center gap-2 border-t border-surface-container"
                >
                  <UserPlus size={14} /> Crear cliente nuevo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Crear rápido */}
        {showQuickCreate && (
          <div className="bg-surface-container-low rounded-md p-3 space-y-2 mt-2">
            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Crear rápido</p>
            <input
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Nombre *"
              className="w-full bg-surface-container-highest rounded-md px-3 py-2 text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              value={quickPhone}
              onChange={(e) => setQuickPhone(e.target.value)}
              placeholder="Teléfono (opcional)"
              className="w-full bg-surface-container-highest rounded-md px-3 py-2 text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button onClick={handleQuickCreate} disabled={!quickName.trim() || creatingSaving} className="flex-1 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-2 text-xs hover:shadow-md transition-all disabled:opacity-50">
                {creatingSaving ? 'Guardando...' : 'Crear'}
              </button>
              <button onClick={() => { setShowQuickCreate(false); setQuickName(''); setQuickPhone(''); }} className="px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container rounded-md transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-outline">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
               <ShoppingBag size={32} />
            </div>
            <p className="font-medium text-sm text-on-surface-variant">La lista está vacía</p>
            <p className="text-xs mt-1 max-w-[200px] text-center text-outline">Selecciona productos del grid para comenzar a facturar.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.codigo} className="flex gap-4 bg-surface-container-lowest rounded-md p-4 shadow-ambient">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-on-surface line-clamp-2 font-manrope">{item.nombre}</h4>
                <p className="text-primary font-bold mt-1">{formatBs(usdToBs(Number(item.precio_usd) * item.quantity, bcvRate))}</p>
                <p className="text-[11px] text-on-surface-variant font-medium">{formatUsd(Number(item.precio_usd) * item.quantity)}</p>
                
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center bg-surface-container rounded-sm overflow-hidden">
                    <button onClick={() => updateQuantity(item.codigo, item.quantity - 1)} className="px-2.5 py-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50" disabled={item.quantity <= 1}>
                      <Minus size={14} />
                    </button>
                    <span className="px-2 text-sm font-bold w-8 text-center text-on-surface">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.codigo, item.quantity + 1)} className="px-2.5 py-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.codigo)} className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors ml-auto">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totales y Checkout */}
      <div className="p-6 bg-surface-container-lowest shrink-0 shadow-[0_-4px_30px_rgba(26,28,28,0.03)]">
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm text-on-surface-variant">
            <span>Subtotal</span>
            <div className="text-right">
              <span className="font-medium text-on-surface block">{formatBs(totalBs)}</span>
              <span className="text-[11px] text-on-surface-variant">{formatUsd(total)}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm text-on-surface-variant">
            <span>Impuestos (0%)</span>
            <span className="font-medium text-on-surface">Bs 0.00</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-on-surface mt-2 pt-3 border-t border-surface-container">
            <span className="font-manrope">Total</span>
            <div className="text-right">
              <span className="text-primary block">{formatBs(totalBs)}</span>
              <span className="text-[12px] text-on-surface-variant">{formatUsd(total)}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-on-surface-variant mb-4">Tasa aplicada: 1 USD = {bcvRate.toFixed(2)} Bs</p>

        {/* Selector de método de pago */}
        <div className="relative mb-4">
          <button 
            onClick={() => setShowMetodos(!showMetodos)}
            className="w-full flex items-center justify-between bg-surface-container-low rounded-md p-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
          >
            <span>{metodoActual.label}</span>
            <ChevronDown size={16} className={`text-outline transition-transform ${showMetodos ? 'rotate-180' : ''}`} />
          </button>
          
          {showMetodos && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-container-lowest rounded-md shadow-[0_4px_30px_rgba(26,28,28,0.12)] overflow-hidden z-10">
              {METODOS_PAGO.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMetodoPago(m.id); setShowMetodos(false); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-surface-container transition-colors ${m.id === metodoPago ? 'text-primary font-bold bg-surface-container-low' : 'text-on-surface'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0 || isCheckingOut}
          className="w-full bg-gradient-to-r from-primary to-primary-container hover:from-primary-container hover:to-primary text-on-primary font-bold rounded-md py-4 px-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 transform active:scale-[0.98]"
        >
          {isCheckingOut ? (
            <>
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard size={20} />
              {metodoPago === 'fiado' ? `Registrar deuda ${formatUsd(total)}` : `Cobrar ${formatBs(totalBs)}`}
            </>
          )}
        </button>
      </div>
      </aside>
    </>
  );
}
