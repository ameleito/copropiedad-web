export interface MeterItem {
  id: string;
  unitNumber: string;
  type: string;
  meterNumber: string | null;
  createdAt: string;
}

export interface MeterReadingItem {
  id: string;
  meterId: string;
  period: string;
  readingValue: number;
  consumption: number | null;
  readByName: string;
  readAt: string;
}
