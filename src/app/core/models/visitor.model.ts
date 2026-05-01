export type VisitorStatusType = 'ESPERADO' | 'INGRESADO' | 'SALIDO' | 'NO_SE_PRESENTO';

export interface VisitorResponse {
  id: string;
  buildingId: string;
  unitId: string;
  unitNumber: string;
  towerName: string | null;
  fullName: string;
  idDocument: string | null;
  expectedAt: string | null;
  entryTime: string | null;
  exitTime: string | null;
  status: VisitorStatusType;
  preregistered: boolean;
  preregisteredByName: string | null;
  loggedByName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PreregisterVisitorRequest {
  unitId?: string;
  fullName: string;
  idDocument?: string;
  expectedAt?: string;
  notes?: string;
}

export interface WalkInVisitorRequest {
  unitId: string;
  fullName: string;
  idDocument?: string;
  notes?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const VIS_STATUS_LABELS: Record<VisitorStatusType, string> = {
  ESPERADO: 'Esperado',
  INGRESADO: 'Ingresado',
  SALIDO: 'Salió',
  NO_SE_PRESENTO: 'No se presentó',
};

export const VIS_STATUS_COLORS: Record<VisitorStatusType, string> = {
  ESPERADO: '#ff9800',
  INGRESADO: '#2196f3',
  SALIDO: '#4caf50',
  NO_SE_PRESENTO: '#9e9e9e',
};

export const VIS_STATUS_ICONS: Record<VisitorStatusType, string> = {
  ESPERADO: 'schedule',
  INGRESADO: 'login',
  SALIDO: 'logout',
  NO_SE_PRESENTO: 'person_off',
};
