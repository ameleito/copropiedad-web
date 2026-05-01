export interface ParkingSpot {
  id: string;
  spotNumber: string;
  floor: number | null;
  unitNumber: string | null;
  status: string;
  visitor: boolean;
}

export interface VehicleInfo {
  id: string;
  unitNumber: string;
  ownerName: string;
  plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
}

export interface ParkingLogEntry {
  id: string;
  spotNumber: string | null;
  plate: string | null;
  vehicleBrand: string | null;
  vehicleColor: string | null;
  entryTime: string;
  exitTime: string | null;
  loggedByName: string | null;
  notes: string | null;
}
