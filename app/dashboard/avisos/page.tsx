import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { TableShell } from '@/components/tables/TableShell';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCurrentUserProfile, getTrabajadores } from '@/actions/auth';
import { getClientes } from '@/actions/clientes';
import { getObras } from '@/actions/obras';
import { createAviso, getAllAvisos } from '@/actions/avisos';

export default async function AvisosPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/signin');
  }
  if (profile.rol !== 'administrador') {
    redirect('/dashboard');
  }

  const [trabajadores, clientes, obras, avisos] = await Promise.all([getTrabajadores(), getClientes(), getObras(), getAllAvisos()]);

  async function createAvisoAction(formData: FormData) {
    'use server';

    const currentProfile = await getCurrentUserProfile();
    if (currentProfile?.rol !== 'administrador') {
      throw new Error('No tienes permisos para crear avisos.');
    }

    const trabajadorId = formData.get('trabajador_id')?.toString();
    const clienteId = formData.get('cliente_id')?.toString();
    const obraId = formData.get('obra_id')?.toString();
    const nota = formData.get('nota')?.toString().trim();

    if (!trabajadorId || !clienteId) {
      throw new Error('Selecciona un trabajador y un cliente.');
    }

    await createAviso({
      trabajadorId,
      clienteId,
      obraId: obraId || null,
      nota: nota || undefined,
      creadoPor: currentProfile.id
    });
    revalidatePath('/dashboard/avisos');
  }

  return (
    <TableShell title="Avisos" description="Pide a un trabajador que registre un parte para un cliente concreto.">
      <form action={createAvisoAction} className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Trabajador</Label>
          <Select name="trabajador_id" required defaultValue="">
            <option value="" disabled>
              Selecciona un trabajador
            </option>
            {trabajadores.map((trabajador) => (
              <option key={trabajador.id} value={trabajador.id}>
                {trabajador.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select name="cliente_id" required defaultValue="">
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Obra (opcional)</Label>
          <Select name="obra_id" defaultValue="">
            <option value="">Cualquier obra</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Crear aviso
          </Button>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <Label>Nota (opcional)</Label>
          <Textarea name="nota" placeholder="Ej. Revisa las horas extra de la semana pasada" className="mt-2 min-h-[80px]" />
        </div>
      </form>

      {avisos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          No hay avisos creados todavía.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Trabajador</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Obra</th>
                <th className="px-4 py-3">Nota</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {avisos.map((aviso) => (
                <tr key={aviso.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-4">{aviso.users?.nombre ?? 'N/A'}</td>
                  <td className="px-4 py-4">{aviso.clientes?.nombre ?? 'N/A'}</td>
                  <td className="px-4 py-4">{aviso.obras?.nombre ?? 'Cualquiera'}</td>
                  <td className="px-4 py-4">{aviso.nota || '—'}</td>
                  <td className="px-4 py-4">
                    <Badge variant={aviso.resuelto ? 'success' : 'warning'}>{aviso.resuelto ? 'resuelto' : 'pendiente'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TableShell>
  );
}
