export type AnnouncementScopeType = 'ALL' | 'TOWER' | 'FLOOR' | 'UNIT';

export interface AnnouncementResponse {
  id: string;
  title: string;
  body: string;
  scope: AnnouncementScopeType;
  scopeValue: string | null;
  sendPush: boolean;
  pushSentAt: string | null;
  createdByName: string;
  createdAt: string;
  read: boolean;
}

export interface CreateAnnouncementRequest {
  title: string;
  body: string;
  scope?: string;
  scopeValue?: string;
  sendPush?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const SCOPE_LABELS: Record<AnnouncementScopeType, string> = {
  ALL: 'Todos',
  TOWER: 'Torre',
  FLOOR: 'Piso',
  UNIT: 'Unidad',
};

export const SCOPE_ICONS: Record<AnnouncementScopeType, string> = {
  ALL: 'apartment',
  TOWER: 'domain',
  FLOOR: 'layers',
  UNIT: 'door_front',
};
