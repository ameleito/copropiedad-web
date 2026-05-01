export interface CommonArea {
  id: string;
  name: string;
  description: string;
  capacity: number | null;
  requiresDeposit: boolean;
  depositAmount: number | null;
  maxHours: number;
  advanceDays: number;
  active: boolean;
}

export interface Booking {
  id: string;
  commonAreaId: string;
  commonAreaName: string;
  unitNumber: string;
  bookedByName: string;
  startTime: string;
  endTime: string;
  attendees: number | null;
  status: string;
  depositPaid: boolean;
  cancellationReason: string | null;
  createdAt: string;
}
