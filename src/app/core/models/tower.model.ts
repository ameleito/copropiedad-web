export interface TowerResponse {
  id: string;
  name: string;
  totalFloors: number;
}

export interface CreateTowerRequest {
  name: string;
  totalFloors?: number | null;
}

export interface UpdateTowerRequest {
  name: string;
  totalFloors?: number | null;
}
