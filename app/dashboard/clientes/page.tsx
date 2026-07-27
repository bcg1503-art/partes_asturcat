import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { TableShell } from '@/components/tables/TableShell';
import { ClienteList } from '@/components/clientes/cliente-list';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getCurrentUserProfile } from '@/actions/auth';
import { getClientes, createCliente, updateCliente, deleteCliente } from '@/actions/clientes';

export default async function ClientesPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/signin');
  }

  const clientes = await getClientes();
  const isAdmin = profile.rol === 'administrador';

  async function createClienteAction(formData: FormData) {
    'use server';

    const currentProfile = await getCurrentUserProfile();
    if (currentProfile?.rol !== 'administrador') {
      throw new Error('No tienes permisos para crear clientes.');
    }

    const nombre = formData.get('nombre')?.toString().trim();
    if (!nombre) {
      throw new Error('El nombre es obligatorio.');
    }

    await createCliente(nombre);
    revalidatePath('/dashboard/clientes');
  }

  async function updateClienteAction(formData: FormData) {
    'use server';

    const currentProfile = await getCurrentUserProfile();
    if (currentProfile?.rol !== 'administrador') {
      throw new Error('No tienes permisos para editar clientes.');
    }

    const id = formData.get('id')?.toString();
    const nombre = formData.get('nombre')?.toString().trim();
    if (!id || !nombre) {
      throw new Error('Datos incompletos.');
    }

    await updateCliente(id, nombre);
    revalidatePath('/dashboard/clientes');
  }

  async function deleteClienteAction(formData: FormData) {
    'use server';

    const currentProfile = await getCurrentUserProfile();
    if (currentProfile?.rol !== 'administrador') {
      throw new Error('No tienes permisos para eliminar clientes.');
    }

    const id = formData.get('id')?.toString();
    if (!id) {
      throw new Error('Falta el identificador del cliente.');
    }

    await deleteCliente(id);
    revalidatePath('/dashboard/clientes');
  }

  return (
    <TableShell title="Clientes" description="Gestiona los clientes de la empresa.">
      {isAdmin ? (
        <form action={createClienteAction} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>Nuevo cliente</Label>
            <Input name="nombre" placeholder="Nombre del cliente" required />
          </div>
          <Button type="submit">Añadir</Button>
        </form>
      ) : null}
      <ClienteList
        clientes={clientes}
        isAdmin={isAdmin}
        updateAction={updateClienteAction}
        deleteAction={deleteClienteAction}
      />
    </TableShell>
  );
}
