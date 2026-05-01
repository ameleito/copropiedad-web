export type InvoiceStatusType = 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'ANULADA';
export type PaymentMethodType = 'PSE' | 'NEQUI' | 'BANCOLOMBIA' | 'EFECTIVO' | 'TRANSFERENCIA';
export type PaymentStatusType = 'INICIADO' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';

export interface FeeTypeResponse {
  id: string;
  name: string;
  description: string | null;
  recurring: boolean;
}

export interface InvoiceResponse {
  id: string;
  unitId: string;
  unitNumber: string;
  towerName: string | null;
  feeTypeName: string | null;
  period: string;
  amount: number;
  lateFee: number;
  totalAmount: number;
  status: InvoiceStatusType;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface PaymentResponse {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethodType;
  status: PaymentStatusType;
  providerRef: string | null;
  initiatedByName: string;
  confirmedAt: string | null;
  createdAt: string;
}

export interface CreateInvoiceRequest {
  unitId: string;
  feeTypeId?: string;
  period: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

export interface RegisterPaymentRequest {
  amount: number;
  method: string;
  providerRef?: string;
}

export interface CreateFeeTypeRequest {
  name: string;
  description?: string;
  recurring?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const INV_STATUS_LABELS: Record<InvoiceStatusType, string> = {
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};

export const INV_STATUS_COLORS: Record<InvoiceStatusType, string> = {
  PENDIENTE: '#ff9800',
  PAGADA: '#4caf50',
  VENCIDA: '#f44336',
  ANULADA: '#9e9e9e',
};

export const INV_STATUS_ICONS: Record<InvoiceStatusType, string> = {
  PENDIENTE: 'pending',
  PAGADA: 'check_circle',
  VENCIDA: 'warning',
  ANULADA: 'cancel',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  PSE: 'PSE',
  NEQUI: 'Nequi',
  BANCOLOMBIA: 'Bancolombia',
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
};
