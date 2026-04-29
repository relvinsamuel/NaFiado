'use client';

import { useState, useEffect } from 'react';
import { useInventoryStore } from '@/lib/inventoryStore';
import { X, Save, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatBs, usdToBs } from '@/lib/currency';
import { useCurrencyStore } from '@/lib/currencyStore';

export default function ProductFormModal() {
  const { editingProduct, isNewProduct, closeForm, saveProduct, isSaving } = useInventoryStore();
  const { bcvRate } = useCurrencyStore();

  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    categoria: 'GENERAL',
    costo_unitario: '',
    margen_detal: '30',
    precio_usd: '',
    stock: '12',
    workspace_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar con datos del producto (edición) o vacío (nuevo)
  useEffect(() => {
    if (editingProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        codigo: editingProduct.codigo,
        nombre: editingProduct.nombre,
        categoria: editingProduct.categoria || 'GENERAL',
        costo_unitario: editingProduct.costo_unitario?.toString() || '',
        margen_detal: editingProduct.margen_detal?.toString() || '30',
        precio_usd: editingProduct.precio_usd?.toString() || '',
        stock: editingProduct.stock?.toString() || '0',
        workspace_id: editingProduct.workspace_id,
      });
    } else {
      // Para nuevo producto, resolvemos workspace desde membership del usuario.
      (async () => {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        if (!userId) return;

        const { data } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', userId)
          .limit(1)
          .single();

        if (data?.workspace_id) {
          setForm((f) => ({ ...f, workspace_id: data.workspace_id }));
        }
      })();
    }
  }, [editingProduct]);

  // Auto-calcular precio_usd cuando cambia costo o margen
  useEffect(() => {
    const costo = parseFloat(form.costo_unitario);
    const margen = parseFloat(form.margen_detal);
    if (!isNaN(costo) && !isNaN(margen) && costo > 0) {
      const precioCalculado = costo + (costo * margen / 100);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(f => ({ ...f, precio_usd: precioCalculado.toFixed(2) }));
    }
  }, [form.costo_unitario, form.margen_detal]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.codigo.trim()) errs.codigo = 'El código es obligatorio';
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.workspace_id) errs.workspace_id = 'No se pudo resolver el workspace';
    if (!form.precio_usd || parseFloat(form.precio_usd) < 0) errs.precio_usd = 'Precio inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await saveProduct({
      codigo: form.codigo.trim(),
      workspace_id: form.workspace_id,
      nombre: form.nombre.trim(),
      categoria: form.categoria.trim() || null,
      costo_unitario: form.costo_unitario ? parseFloat(form.costo_unitario) : null,
      margen_detal: form.margen_detal ? parseFloat(form.margen_detal) : null,
      precio_usd: form.precio_usd ? parseFloat(form.precio_usd) : null,
      stock: form.stock ? parseInt(form.stock) : 0,
    });
  };

  const inputClass = (field: string) =>
    `w-full bg-surface-container-highest border rounded-md px-4 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-1 transition-all ${
      errors[field] ? 'border-[#f44336] focus:ring-[#f44336]' : 'border-outline-variant/20 focus:border-primary focus:ring-primary'
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm" onClick={closeForm} />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest rounded-xl shadow-[0_10px_60px_rgba(26,28,28,0.15)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest px-6 py-5 flex items-center justify-between z-10 shadow-[0_2px_10px_rgba(26,28,28,0.03)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-manrope font-bold text-on-surface">
                {isNewProduct ? 'Nuevo Producto' : 'Editar Producto'}
              </h2>
              <p className="text-xs text-on-surface-variant">Ficha detallada del producto</p>
            </div>
          </div>
          <button onClick={closeForm} className="p-2 text-outline hover:text-on-surface transition-colors rounded-md hover:bg-surface-container">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Sección: Identificación */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-4">
              Identificación
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Código / Barras</label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))}
                  disabled={!isNewProduct}
                  className={`${inputClass('codigo')} ${!isNewProduct ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="Ej: SKU-001 o código de barras"
                />
                {errors.codigo && <p className="text-[#f44336] text-xs mt-1">{errors.codigo}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Nombre del Producto</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className={inputClass('nombre')}
                  placeholder="Ej: CLORO JABONOSO"
                />
                {errors.nombre && <p className="text-[#f44336] text-xs mt-1">{errors.nombre}</p>}
              </div>
            </div>
          </div>

          {/* Sección: Categoría y Stock */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-4">
              Clasificación
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Categoría</label>
                <input
                  type="text"
                  value={form.categoria}
                  onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className={inputClass('categoria')}
                  placeholder="GENERAL"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Stock Disponible</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))}
                  className={inputClass('stock')}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Sección: Precios y Márgenes */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-4">
              Precio y Margen
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Costo Unitario ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.costo_unitario}
                  onChange={(e) => setForm(f => ({ ...f, costo_unitario: e.target.value }))}
                  className={inputClass('costo_unitario')}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Margen Ganancia (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.margen_detal}
                  onChange={(e) => setForm(f => ({ ...f, margen_detal: e.target.value }))}
                  className={inputClass('margen_detal')}
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Precio Venta (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio_usd}
                  onChange={(e) => setForm(f => ({ ...f, precio_usd: e.target.value }))}
                  className={`${inputClass('precio_usd')} font-bold text-primary`}
                  placeholder="0.00"
                />
                {errors.precio_usd && <p className="text-[#f44336] text-xs mt-1">{errors.precio_usd}</p>}
                {form.costo_unitario && form.margen_detal && (
                  <p className="text-[10px] text-on-surface-variant mt-1 italic">
                    ↑ Calculado automáticamente: costo × (1 + margen%)
                  </p>
                )}
                {form.precio_usd && parseFloat(form.precio_usd) > 0 && (
                  <p className="text-[11px] text-primary mt-1 font-semibold">
                    Equivale a {formatBs(usdToBs(parseFloat(form.precio_usd), bcvRate))} a tasa BCV actual
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-3 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isNewProduct ? 'Crear Producto' : 'Guardar Cambios'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-6 py-3 rounded-md text-on-surface-variant font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancelar
            </button>
          </div>
          {errors.workspace_id && (
            <p className="text-[#f44336] text-xs mt-3 text-center">{errors.workspace_id}</p>
          )}
        </form>
      </div>
    </div>
  );
}
