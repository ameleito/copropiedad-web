export type PackageStatusType = 'RECIBIDO' | 'NOTIFICADO' | 'ENTREGADO';

export interface PackageResponse {
  id: string;
  buildingId: string;
  unitId: string;
  unitNumber: string;
  towerName: string | null;
  courier: string | null;
  recipientName: string | null;
  description: string | null;
  photoUrl: string | null;
  status: PackageStatusType;
  receivedByName: string;
  deliveredToName: string | null;
  receivedAt: string;
  notifiedAt: string | null;
  deliveredAt: string | null;
}

export interface ReceivePackageRequest {
  unitId: string;
  courier?: string;
  recipientName?: string;
  description?: string;
}

export interface DeliverPackageRequest {
  deliveredToUserId: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const PKG_STATUS_LABELS: Record<PackageStatusType, string> = {
  RECIBIDO: 'Recibido',
  NOTIFICADO: 'Notificado',
  ENTREGADO: 'Entregado',
};

export const PKG_STATUS_COLORS: Record<PackageStatusType, string> = {
  RECIBIDO: '#ff9800',
  NOTIFICADO: '#2196f3',
  ENTREGADO: '#4caf50',
};

export const PKG_STATUS_ICONS: Record<PackageStatusType, string> = {
  RECIBIDO: 'inventory_2',
  NOTIFICADO: 'notifications_active',
  ENTREGADO: 'check_circle',
};
