import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import {
  CreateFeeTypeRequest,
  CreateInvoiceRequest,
  FeeTypeResponse,
  InvoiceResponse,
  PageResponse,
  PaymentResponse,
  RegisterPaymentRequest,
} from '../../core/models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/finance`;

  listFeeTypes(): Observable<FeeTypeResponse[]> {
    return this.http
      .get<ApiResponse<FeeTypeResponse[]>>(`${this.baseUrl}/fee-types`)
      .pipe(map((res) => res.data));
  }

  createFeeType(request: CreateFeeTypeRequest): Observable<FeeTypeResponse> {
    return this.http
      .post<ApiResponse<FeeTypeResponse>>(`${this.baseUrl}/fee-types`, request)
      .pipe(map((res) => res.data));
  }

  listInvoices(page = 0, size = 20, status?: string): Observable<PageResponse<InvoiceResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiResponse<PageResponse<InvoiceResponse>>>(`${this.baseUrl}/invoices`, { params })
      .pipe(map((res) => res.data));
  }

  getInvoice(id: string): Observable<InvoiceResponse> {
    return this.http
      .get<ApiResponse<InvoiceResponse>>(`${this.baseUrl}/invoices/${id}`)
      .pipe(map((res) => res.data));
  }

  createInvoice(request: CreateInvoiceRequest): Observable<InvoiceResponse> {
    return this.http
      .post<ApiResponse<InvoiceResponse>>(`${this.baseUrl}/invoices`, request)
      .pipe(map((res) => res.data));
  }

  cancelInvoice(id: string): Observable<InvoiceResponse> {
    return this.http
      .put<ApiResponse<InvoiceResponse>>(`${this.baseUrl}/invoices/${id}/cancel`, {})
      .pipe(map((res) => res.data));
  }

  registerPayment(invoiceId: string, request: RegisterPaymentRequest): Observable<PaymentResponse> {
    return this.http
      .post<ApiResponse<PaymentResponse>>(`${this.baseUrl}/invoices/${invoiceId}/payments`, request)
      .pipe(map((res) => res.data));
  }

  getPayments(invoiceId: string): Observable<PaymentResponse[]> {
    return this.http
      .get<ApiResponse<PaymentResponse[]>>(`${this.baseUrl}/invoices/${invoiceId}/payments`)
      .pipe(map((res) => res.data));
  }
}
