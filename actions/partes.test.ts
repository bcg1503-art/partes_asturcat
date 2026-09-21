import { beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseServer } = vi.hoisted(() => ({
  supabaseServer: vi.fn()
}));

vi.mock('@/lib/supabase-server', () => ({ supabaseServer }));

import { createRegistroParte, parseParteFormData, updateRegistroParte } from './partes';

function chain(result: { data?: unknown; error?: unknown }) {
  const obj: Record<string, unknown> = {};
  const self = () => obj;
  obj.insert = self;
  obj.update = self;
  obj.delete = self;
  obj.select = self;
  obj.eq = self;
  obj.order = self;
  obj.single = vi.fn().mockResolvedValue(result);
  obj.maybeSingle = vi.fn().mockResolvedValue(result);
  obj.then = (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return obj;
}

function baseFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields = {
    fecha: '2026-09-15',
    cliente_id: 'cliente-1',
    horas: '8',
    observaciones: 'Sin incidencias',
    ...overrides
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe('parseParteFormData', () => {
  it('extracts and coerces the expected fields from FormData', () => {
    const formData = baseFormData({ horas: '3.25' });

    expect(parseParteFormData(formData)).toEqual({
      fecha: '2026-09-15',
      cliente_id: 'cliente-1',
      horas: 3.25,
      observaciones: 'Sin incidencias'
    });
  });

  it('defaults missing fields to empty strings, horas to 0 and observaciones to null', () => {
    const formData = new FormData();

    expect(parseParteFormData(formData)).toEqual({
      fecha: '',
      cliente_id: '',
      horas: 0,
      observaciones: null
    });
  });
});

describe('createRegistroParte', () => {
  beforeEach(() => {
    supabaseServer.mockReset();
  });

  it('creates a new parte header and its first registro when the combination is new', async () => {
    const partesChain = chain({ data: { id: 'parte-1', numero_parte: 1, estado: 'pendiente' }, error: null });
    const registrosChain = chain({ data: { id: 'registro-1' }, error: null });
    const from = vi.fn((table: string) => (table === 'partes' ? partesChain : registrosChain));
    supabaseServer.mockReturnValue({ from });

    const result = await createRegistroParte('user-1', baseFormData());

    expect(result.parte).toEqual({ id: 'parte-1', numero_parte: 1, estado: 'pendiente' });
    expect(result.registro).toEqual({ id: 'registro-1' });
    expect(from).toHaveBeenCalledWith('registros_parte');
  });

  it('reuses the existing parte (no duplicate) and appends a new registro instead of overwriting', async () => {
    const partesChain = chain({ data: { id: 'parte-existing', numero_parte: 1, estado: 'pendiente' }, error: null });
    (partesChain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key' }
    });
    const registrosChain = chain({ data: { id: 'registro-2' }, error: null });
    const from = vi.fn((table: string) => (table === 'partes' ? partesChain : registrosChain));
    supabaseServer.mockReturnValue({ from });

    const result = await createRegistroParte('user-1', baseFormData({ fecha: '2026-09-16' }));

    expect(result.parte.id).toBe('parte-existing');
    expect(result.registro).toEqual({ id: 'registro-2' });
  });

  it('reopens (back to pendiente) a parte that had already been revisado when a new registro is added', async () => {
    const partesChain = chain({ data: { id: 'parte-closed', numero_parte: 1, estado: 'revisado' }, error: null });
    const registrosChain = chain({ data: { id: 'registro-3' }, error: null });
    const from = vi.fn((table: string) => (table === 'partes' ? partesChain : registrosChain));
    supabaseServer.mockReturnValue({ from });

    const result = await createRegistroParte('user-1', baseFormData());

    expect(result.parte.estado).toBe('pendiente');
    expect(result.registro).toEqual({ id: 'registro-3' });
  });
});

describe('updateRegistroParte', () => {
  beforeEach(() => {
    supabaseServer.mockReset();
  });

  it('updates a registro that belongs to the requesting user and stays within the same month', async () => {
    const fetchChain = chain({
      data: {
        id: 'registro-1',
        fecha: '2026-09-15',
        horas: 8,
        partes: { id: 'parte-1', trabajador_id: 'user-1', mes: 9, ano: 2026, estado: 'pendiente' }
      },
      error: null
    });
    const from = vi.fn().mockReturnValue(fetchChain);
    supabaseServer.mockReturnValue({ from });

    await updateRegistroParte('registro-1', 'user-1', baseFormData({ fecha: '2026-09-20', horas: '5' }));

    expect(from).toHaveBeenCalledWith('registros_parte');
  });

  it('rejects edits from a user who does not own the registro', async () => {
    const fetchChain = chain({
      data: {
        id: 'registro-1',
        partes: { id: 'parte-1', trabajador_id: 'user-1', mes: 9, ano: 2026, estado: 'pendiente' }
      },
      error: null
    });
    supabaseServer.mockReturnValue({ from: vi.fn().mockReturnValue(fetchChain) });

    await expect(updateRegistroParte('registro-1', 'user-2', baseFormData())).rejects.toThrow(/No puedes editar/);
  });

  it('rejects moving the date to a different month than the parte', async () => {
    const fetchChain = chain({
      data: {
        id: 'registro-1',
        partes: { id: 'parte-1', trabajador_id: 'user-1', mes: 9, ano: 2026, estado: 'pendiente' }
      },
      error: null
    });
    supabaseServer.mockReturnValue({ from: vi.fn().mockReturnValue(fetchChain) });

    await expect(updateRegistroParte('registro-1', 'user-1', baseFormData({ fecha: '2026-10-01' }))).rejects.toThrow(
      /mes distinto/
    );
  });
});
