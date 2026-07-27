'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import type { Cliente } from '@/types';

interface ClienteListProps {
  clientes: Cliente[];
  isAdmin: boolean;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function ClienteList({ clientes, isAdmin, updateAction, deleteAction }: ClienteListProps) {
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  if (clientes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
        No hay clientes registrados todavía.
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
              {isAdmin ? <th className="px-4 py-3">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-4">{cliente.nombre}</td>
                {isAdmin ? (
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" type="button" onClick={() => setEditingCliente(cliente)}>
                        Editar
                      </Button>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={cliente.id} />
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

      <Modal open={editingCliente !== null} title="Editar cliente" onClose={() => setEditingCliente(null)}>
        {editingCliente ? (
          <form
            action={async (formData) => {
              await updateAction(formData);
              setEditingCliente(null);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={editingCliente.id} />
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input name="nombre" defaultValue={editingCliente.nombre} required />
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
