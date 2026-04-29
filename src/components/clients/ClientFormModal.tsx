'use client';

import { useState, useEffect } from 'react';
import { useClientStore } from '@/lib/clientStore';
import { X, Save, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ClientFormModal() {
  const { editingClient, isNewClient, closeForm, saveClient, isSaving } = useClientStore();

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    cedula: '',
    email: '',
    direccion: '',
    notas: '',
    workspace_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingClient) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nombre: editingClient.nombre,
        telefono: editingClient.telefono || '',
        cedula: editingClient.cedula || '',
        email: editingClient.email || '',
        direccion: editingClient.direccion || '',
        notas: editingClient.notas || '',
        workspace_id: editingClient.workspace_id,
      });
    } else {
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
  }, [editingClient]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.workspace_id) errs.workspace_id = 'No se pudo resolver el workspace';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await saveClient({
      id: editingClient?.id,
      workspace_id: form.workspace_id,
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      cedula: form.cedula.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      notas: form.notas.trim() || null,
    });
  };

  const inputClass = (field: string) =>
    `w-full bg-surface-container-highest border rounded-md px-4 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-1 transition-all ${
      errors[field] ? 'border-[#f44336] focus:ring-[#f44336]' : 'border-outline-variant/20 focus:border-primary focus:ring-primary'
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm" onClick={closeForm} />

      <div className="relative bg-surface-container-lowest rounded-xl shadow-[0_10px_60px_rgba(26,28,28,0.15)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-container-lowest px-6 py-5 flex items-center justify-between z-10 shadow-[0_2px_10px_rgba(26,28,28,0.03)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-manrope font-bold text-on-surface">
                {isNewClient ? 'Nuevo Cliente' : 'Editar Cliente'}
              </h2>
              <p className="text-xs text-on-surface-variant">Datos del cliente</p>
            </div>
          </div>
          <button onClick={closeForm} className="p-2 text-outline hover:text-on-surface transition-colors rounded-md hover:bg-surface-container">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputClass('nombre')} placeholder="Nombre completo" />
            {errors.nombre && <p className="text-[#f44336] text-xs mt-1">{errors.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Cédula</label>
              <input type="text" value={form.cedula} onChange={(e) => setForm(f => ({ ...f, cedula: e.target.value }))} className={inputClass('cedula')} placeholder="V-12345678" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Teléfono</label>
              <input type="text" value={form.telefono} onChange={(e) => setForm(f => ({ ...f, telefono: e.target.value }))} className={inputClass('telefono')} placeholder="0412-1234567" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass('email')} placeholder="correo@ejemplo.com" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Dirección</label>
            <input type="text" value={form.direccion} onChange={(e) => setForm(f => ({ ...f, direccion: e.target.value }))} className={inputClass('direccion')} placeholder="Dirección del cliente" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))} className={`${inputClass('notas')} resize-none`} rows={2} placeholder="Observaciones..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-md py-3 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? (
                <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
              ) : (
                <><Save size={18} /> {isNewClient ? 'Crear Cliente' : 'Guardar Cambios'}</>
              )}
            </button>
            <button type="button" onClick={closeForm} className="px-6 py-3 rounded-md text-on-surface-variant font-semibold hover:bg-surface-container-high transition-colors">
              Cancelar
            </button>
          </div>
          {errors.workspace_id && <p className="text-[#f44336] text-xs mt-2 text-center">{errors.workspace_id}</p>}
        </form>
      </div>
    </div>
  );
}
