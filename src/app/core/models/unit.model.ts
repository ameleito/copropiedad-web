export interface UnitResponse {
  id: string;
  number: string;
  floor: number | null;
  type: string;
  isOccupied: boolean;
  towerId: string | null;
  towerName: string | null;
  interiorId: string | null;
  interiorName: string | null;
}

export interface CreateUnitRequest {
  number: string;
  towerId?: string | null;
  interiorId?: string | null;
  floor?: number | null;
}

export interface UpdateUnitRequest {
  number: string;
  towerId?: string | null;
  interiorId?: string | null;
  floor?: number | null;
}
