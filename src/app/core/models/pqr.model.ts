export type PqrTipo = 'PETICION' | 'QUEJA' | 'RECLAMO';
export type PqrCategory = 'PLOMERIA' | 'ELECTRICIDAD' | 'ZONAS_COMUNES' | 'SEGURIDAD' | 'RUIDO' | 'ASEO' | 'ASCENSOR' | 'FACHADA' | 'OTRO';
export type PqrPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type PqrStatus = 'RADICADO' | 'EN_GESTION' | 'ASIGNADO' | 'EN_EJECUCION' | 'RESUELTO' | 'CERRADO' | 'RECHAZADO';

export interface PqrPhoto {
  id: string;
  url: string;
  phase: string;
  createdAt: string;
}

export interface PqrResponse {
  id: string;
  tipo: PqrTipo;
  category: PqrCategory;
  title: string;
  description: string;
  priority: PqrPriority;
  status: PqrStatus;
  unitNumber: string;
  createdByName: string;
  createdById: string;
  assignedToName?: string;
  assignedToId?: string;
  slaHours: number;
  slaDeadline: string;
  slaBreached: boolean;
  rejectionReason?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  photos: PqrPhoto[];
}

export interface PqrHistoryEntry {
  id: string;
  actorName: string;
  actorId: string;
  fromStatus?: string;
  toStatus: string;
  comment?: string;
  createdAt: string;
}

export interface CreatePqrRequest {
  tipo: PqrTipo;
  category: PqrCategory;
  title: string;
  description: string;
  priority?: PqrPriority;
  unitId?: string;
}

export interface UpdatePqrStatusRequest {
  status: PqrStatus;
  comment?: string;
  rejectionReason?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
}

export interface AssignPqrRequest {
  assigneeId: string;
  comment?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Display labels in Spanish
export const PQR_TIPO_LABELS: Record<PqrTipo, string> = {
  PETICION: 'Petición',
  QUEJA: 'Queja',
  RECLAMO: 'Reclamo',
};

export const PQR_CATEGORY_LABELS: Record<PqrCategory, string> = {
  PLOMERIA: 'Plomería',
  ELECTRICIDAD: 'Electricidad',
  ZONAS_COMUNES: 'Zonas Comunes',
  SEGURIDAD: 'Seguridad',
  RUIDO: 'Ruido',
  ASEO: 'Aseo',
  ASCENSOR: 'Ascensor',
  FACHADA: 'Fachada',
  OTRO: 'Otro',
};

export const PQR_PRIORITY_LABELS: Record<PqrPriority, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const PQR_STATUS_LABELS: Record<PqrStatus, string> = {
  RADICADO: 'Radicado',
  EN_GESTION: 'En Gestión',
  ASIGNADO: 'Asignado',
  EN_EJECUCION: 'En Ejecución',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  RECHAZADO: 'Rechazado',
};

export const PQR_STATUS_COLORS: Record<PqrStatus, string> = {
  RADICADO: '#9E9E9E',
  EN_GESTION: '#2196F3',
  ASIGNADO: '#FF9800',
  EN_EJECUCION: '#FF5722',
  RESUELTO: '#4CAF50',
  CERRADO: '#607D8B',
  RECHAZADO: '#F44336',
};
