export interface InteriorResponse {
  id: string;
  name: string;
  towerId: string | null;
  towerName: string | null;
}

export interface CreateInteriorRequest {
  name: string;
  towerId?: string | null;
}

export interface UpdateInteriorRequest {
  name: string;
  towerId?: string | null;
}
