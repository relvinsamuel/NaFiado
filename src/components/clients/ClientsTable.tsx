'use client';

import { useClientStore, Client, ClientBalance } from '@/lib/clientStore';
import { Pencil, Trash2, Phone, Mail, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatBs, formatUsd, usdToBs } from '@/lib/currency';
import { useCurrencyStore } from '@/lib/currencyStore';

export default function ClientsTable({ clients, balances }: { clients: Client[]; balances: Map<string, ClientBalance> }) {
  const { openEditClient, deleteClient } = useClientStore();
  const router = useRouter();
  const { bcvRate } = useCurrencyStore();

  const handleDelete = async (client: Client) => {
    if (!confirm(`¿Eliminar al cliente "${client.nombre}"? Las ventas asociadas NO se eliminarán.`)) return;
    await deleteClient(client.id);
  };

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant bg-surface-container-lowest rounded-md">
        <p className="text-sm font-medium">No se encontraron clientes</p>
        <p className="text-xs mt-1 text-outline">Crea uno nuevo con el botón de arriba</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-md overflow-hidden shadow-ambient">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-wider">
            <th className="text-left px-5 py-3">Cliente</th>
            <th className="text-left px-5 py-3 hidden md:table-cell">Cédula</th>
            <th className="text-left px-5 py-3 hidden md:table-cell">Contacto</th>
            <th className="text-right px-5 py-3 hidden lg:table-cell">Total Compras</th>
            <th className="text-right px-5 py-3">Saldo Pendiente</th>
            <th className="text-right px-5 py-3 w-32">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const balance = balances.get(client.id);
            const saldo = balance?.saldoPendiente ?? 0;
            const totalCompras = balance?.totalCompras ?? 0;

            return (
              <tr key={client.id} className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-bold text-on-surface font-manrope">{client.nombre}</p>
                  {client.notas && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{client.notas}</p>}
                </td>
                <td className="px-5 py-4 hidden md:table-cell text-on-surface-variant">
                  {client.cedula || '—'}
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="flex flex-col gap-1 text-on-surface-variant text-xs">
                    {client.telefono && (
                      <span className="flex items-center gap-1"><Phone size={12} /> {client.telefono}</span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1"><Mail size={12} /> {client.email}</span>
                    )}
                    {!client.telefono && !client.email && '—'}
                  </div>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell text-right font-bold text-on-surface">
                  <div>
                    <span className="block">{formatBs(usdToBs(totalCompras, bcvRate))}</span>
                    <span className="text-[11px] text-on-surface-variant">{formatUsd(totalCompras)}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  {saldo > 0 ? (
                    <span className="bg-[#f44336]/15 text-[#f44336] text-xs font-bold px-2.5 py-1 rounded-full">
                      {formatUsd(saldo)}
                    </span>
                  ) : (
                    <span className="bg-[#4caf50]/15 text-[#4caf50] text-xs font-bold px-2.5 py-1 rounded-full">
                      Al día
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => router.push(`/clients/${client.id}`)} className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Ver perfil">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEditClient(client)} className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(client)} className="p-2 text-secondary hover:text-[#f44336] hover:bg-[#f44336]/10 rounded transition-colors" title="Eliminar">
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
  );
}
