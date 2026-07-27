import { beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseServer, uploadFirma, uploadFotoParte } = vi.hoisted(() => ({
  supabaseServer: vi.fn(),
  uploadFirma: vi.fn(),
  uploadFotoParte: vi.fn()
}));

vi.mock('@/lib/supabase-server', () => ({ supabaseServer }));
vi.mock('@/actions/storage', () => ({ uploadFirma, uploadFotoParte }));

import { createParteConAdjuntos, parseParteFormData, updateParteConAdjuntos } from './partes';

function chainable(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.insert = self;
  chain.update = self;
  chain.delete = self;
  chain.select = self;
  chain.eq = self;
  chain.or = self;
  chain.single = vi.fn().mockResolvedValue(result);
  chain.then = (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

function baseFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields = {
    fecha: '2026-07-27',
    cliente_id: 'cliente-1',
    obra_id: 'obra-1',
    horas: '4.5',
    descripcion: 'Revisión de instalación',
    materiales: 'Cable',
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
      fecha: '2026-07-27',
      cliente_id: 'cliente-1',
      obra_id: 'obra-1',
      horas: 3.25,
      descripcion: 'Revisión de instalación',
      materiales: 'Cable',
      observaciones: 'Sin incidencias'
    });
  });

  it('defaults missing fields to empty strings and horas to 0', () => {
    const formData = new FormData();

    expect(parseParteFormData(formData)).toEqual({
      fecha: '',
      cliente_id: '',
      obra_id: '',
      horas: 0,
      descripcion: '',
      materiales: '',
      observaciones: ''
    });
  });
});

describe('createParteConAdjuntos', () => {
  beforeEach(() => {
    supabaseServer.mockReset();
    uploadFirma.mockReset();
    uploadFotoParte.mockReset();
  });

  it('creates the parte and skips uploads when there is no firma or fotos', async () => {
    const partesChain = chainable({ data: { id: 'parte-1' }, error: null });
    supabaseServer.mockReturnValue({ from: vi.fn().mockReturnValue(partesChain) });

    const formData = baseFormData();
    const parte = await createParteConAdjuntos('user-1', formData);

    expect(parte).toEqual({ id: 'parte-1' });
    expect(uploadFirma).not.toHaveBeenCalled();
    expect(uploadFotoParte).not.toHaveBeenCalled();
  });

  it('uploads the firma and links it to the created parte', async () => {
    const partesChain = chainable({ data: { id: 'parte-2' }, error: null });
    const from = vi.fn().mockReturnValue(partesChain);
    supabaseServer.mockReturnValue({ from });
    uploadFirma.mockResolvedValue('https://storage.example/firmas/user-1.png');

    const formData = baseFormData({ firma: 'data:image/png;base64,abc123' });
    await createParteConAdjuntos('user-1', formData);

    expect(uploadFirma).toHaveBeenCalledWith('user-1', 'data:image/png;base64,abc123');
    expect(from).toHaveBeenCalledWith('partes');
  });
});

describe('updateParteConAdjuntos', () => {
  beforeEach(() => {
    supabaseServer.mockReset();
    uploadFirma.mockReset();
    uploadFotoParte.mockReset();
  });

  it('updates the parte with the parsed fields', async () => {
    const partesChain = chainable({ data: { id: 'parte-3' }, error: null });
    const from = vi.fn().mockReturnValue(partesChain);
    supabaseServer.mockReturnValue({ from });

    const formData = baseFormData({ descripcion: 'Cambio de descripción' });
    await updateParteConAdjuntos('parte-3', 'user-1', formData);

    expect(from).toHaveBeenCalledWith('partes');
    expect(uploadFirma).not.toHaveBeenCalled();
  });
});
