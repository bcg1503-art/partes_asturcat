'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import type { Cliente, Obra } from '@/types';

type ObraConCliente = Obra & { clientes: { id: string; nombre: string } | null };

interface ObraListProps {
  obras: ObraConCliente[];
  clientes: Cliente[];
  isAdmin: boolean;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function ObraList({ obras, clientes, isAdmin, updateAction, deleteAction }: ObraListProps) {
  const [editingObra, setEditingObra] = useState<ObraConCliente | null>(null);

  if (obras.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
        No hay obras registradas todavía.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700 dark:text-slate-200">
          <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Cliente</th>
              {isAdmin ? <th className="px-4 py-3">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {obras.map((obra) => (
              <tr key={obra.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-4">{obra.nombre}</td>
                <td className="px-4 py-4">{obra.clientes?.nombre ?? 'N/A'}</td>
                {isAdmin ? (
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" type="button" onClick={() => setEditingObra(obra)}>
                        Editar
                      </Button>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={obra.id} />
                        <Button variant="outline" type="submit">
                          Eliminar
                        </Button>
                      </form>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={editingObra !== null} title="Editar obra" onClose={() => setEditingObra(null)}>
        {editingObra ? (
          <form
            action={async (formData) => {
              await updateAction(formData);
              setEditingObra(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editingObra.id} />
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input name="nombre" defaultValue={editingObra.nombre} required />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select name="cliente_id" defaultValue={editingObra.cliente_id} required>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
