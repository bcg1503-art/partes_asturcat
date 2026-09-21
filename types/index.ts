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

/**
 * Header for a trabajador+cliente+mes/ano combination. The actual work days
 * are stored as RegistroParte rows linked via parte_id.
 */
export interface Parte {
  id: string;
  numero_parte: number;
  trabajador_id: string;
  cliente_id: string;
  mes: number;
  ano: number;
  estado: ParteEstado;
  created_at: string;
}

export interface RegistroParte {
  id: string;
  parte_id: string;
  fecha: string;
  horas: number;
  observaciones?: string | null;
  created_at: string;
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
