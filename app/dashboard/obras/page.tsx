import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { TableShell } from '@/components/tables/TableShell';
import { ObraList } from '@/components/obras/obra-list';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getCurrentUserProfile } from '@/actions/auth';
import { getClientes } from '@/actions/clientes';
import { getObras, createObra, updateObra, deleteObra } from '@/actions/obras';

export default async function ObrasPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/signin');
  }

  const [obras, clientes] = await Promise.all([getObras(), getClientes()]);
  const isAdmin = profile.rol === 'administrador';

  async function createObraAction(formData: FormData) {
    'use server';

    const currentProfile = await getCurrentUserProfile();
    if (currentProfile?.rol !== 'administrador') {
      throw new Error('No tienes permisos para crear obras.');
    }

    const nombre = formData.get('nombre')?.toString().trim();
    const clienteId = formData.get('cliente_id')?.toString();
    if (!nombre || !clienteId) {
      throw new Error('Datos incompletos.');
    }

    await createObra(nombre, clienteId);
    revalidatePath('/dashboard/obras');
  }

  async function updateObraAction(formData: FormData) {
    'use server';

    const currentProfile = await getCurrentUserProfile();
    if (currentProfile?.rol !== 'administrador') {
      throw new Error('No tienes permisos para editar obras.');
    }

    const id = formData.get('id')?.toString();
    const nombre = formData.get('nombre')?.toString().trim();
    const clienteId = formData.get('cliente_id')?.toString();
    if (!id || !nombre || !clienteId) {
      throw new Error('Datos incompletos.');
    }

    await updateObra(id, nombre, clienteId);
    revalidatePath('/dashboard/obras');
  }

  async function deleteObraAction(formData: FormData) {
    'use server';

    const currentProfile = await getCurrentUserProfile();
    if (currentProfile?.rol !== 'administrador') {
      throw new Error('No tienes permisos para eliminar obras.');
    }

    const id = formData.get('id')?.toString();
    if (!id) {
      throw new Error('Falta el identificador de la obra.');
    }

    await deleteObra(id);
    revalidatePath('/dashboard/obras');
  }

  return (
    <TableShell title="Obras" description="Gestiona las obras asociadas a cada cliente.">
      {isAdmin ? (
        <form action={createObraAction} className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input name="nombre" placeholder="Nombre de la obra" required />
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
          <Button type="submit">Añadir</Button>
        </form>
      ) : null}
      <ObraList
        obras={obras}
        clientes={clientes}
        isAdmin={isAdmin}
        updateAction={updateObraAction}
        deleteAction={deleteObraAction}
      />
    </TableShell>
  );
}
