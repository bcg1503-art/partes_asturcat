export type UserRole = 'trabajador' | 'administrador';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  avatar_url?: string | null;
}

export interface Cliente {
  id: string;
  nombre: string;
}

export interface Obra {
  id: string;
  nombre: string;
  cliente_id: string;
}

export type ParteEstado = 'pendiente' | 'revisado';

export interface Parte {
  id: string;
  trabajador_id: string;
  cliente_id: string;
  obra_id: string;
  fecha: string;
  horas: number;
  descripcion: string;
  materiales: string;
  observaciones: string;
  firma_url?: string;
  estado: ParteEstado;
  created_at: string;
}

export interface FotosParte {
  id: string;
  parte_id: string;
  foto_url: string;
}

export interface Aviso {
  id: string;
  trabajador_id: string;
  cliente_id: string;
  obra_id?: string | null;
  creado_por: string;
  nota?: string | null;
  resuelto: boolean;
  created_at: string;
}
