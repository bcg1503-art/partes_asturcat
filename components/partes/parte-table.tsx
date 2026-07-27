'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Parte } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

interface ParteTableProps {
  partes: Array<
    Parte & { users?: { nombre: string; avatar_url?: string | null }; clientes?: { nombre: string }; obras?: { nombre: string } }
  >;
  isAdmin: boolean;
}

export function ParteTable({ partes, isAdmin }: ParteTableProps) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredPartes = useMemo(() => {
    return partes
      .filter((parte) => {
        const search = searchText.toLowerCase();
        const matchesSearch =
          parte.descripcion.toLowerCase().includes(search) ||
          parte.clientes?.nombre.toLowerCase().includes(search) ||
          parte.obras?.nombre.toLowerCase().includes(search) ||
          (isAdmin ? parte.users?.nombre.toLowerCase().includes(search) : false);
        const matchesStatus = statusFilter ? parte.estado === statusFilter : true;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        return sortAsc ? dateA - dateB : dateB - dateA;
      });
  }, [partes, searchText, statusFilter, sortAsc, isAdmin]);

  const statusVariant = (status: string) => {
    if (status === 'revisado') return 'success';
    if (status === 'pendiente') return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <input
            className="h-12 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-900/20"
            placeholder="Buscar descripción, cliente u obra"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <select
            className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-900/20"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="revisado">Revisado</option>
          </select>
          <Button variant="outline" onClick={() => setSortAsc((current) => !current)}>
            Ordenar por fecha {sortAsc ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {filteredPartes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          No se encontraron partes que coincidan con los filtros.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                {isAdmin ? <th className="px-4 py-3">Trabajador</th> : null}
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Obra</th>
                <th className="px-4 py-3">Horas</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartes.map((parte) => (
                <tr key={parte.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-4">{new Date(parte.fecha).toLocaleDateString('es-ES')}</td>
                  {isAdmin ? (
                    <td className="px-4 py-4">
                      {parte.users?.nombre ? (
                        <div className="flex items-center gap-2">
                          <Avatar nombre={parte.users.nombre} avatarUrl={parte.users.avatar_url} size="sm" />
                          <span>{parte.users.nombre}</span>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  ) : null}
                  <td className="px-4 py-4">{parte.clientes?.nombre ?? 'N/A'}</td>
                  <td className="px-4 py-4">{parte.obras?.nombre ?? 'N/A'}</td>
                  <td className="px-4 py-4">{parte.horas}</td>
                  <td className="px-4 py-4">
                    <Badge variant={statusVariant(parte.estado)}>{parte.estado}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      className="text-brand-600 underline decoration-brand-200 transition hover:text-brand-700 dark:text-brand-300"
                      href={`/dashboard/partes/${parte.id}`}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
