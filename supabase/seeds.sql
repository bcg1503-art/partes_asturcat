-- Seed sample data for Partes de Trabajo app

insert into clientes (id, nombre) values
  ('00000000-0000-0000-0000-000000000001', 'Cliente Alfa'),
  ('00000000-0000-0000-0000-000000000002', 'Cliente Beta')
on conflict do nothing;

insert into obras (id, nombre, cliente_id) values
  ('10000000-0000-0000-0000-000000000001', 'Obra Centro', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Obra Norte', '00000000-0000-0000-0000-000000000002')
on conflict do nothing;
