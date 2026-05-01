import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { Booking, CommonArea } from '../../core/models/booking.model';
import { PageResponse } from '../../core/models/visitor.model';

export interface CreateBookingRequest {
  commonAreaId: string;
  startTime: string;
  endTime: string;
  attendees?: number | null;
}

export interface CreateCommonAreaRequest {
  name: string;
  description: string;
  capacity: number | null;
  requiresDeposit: boolean;
  depositAmount: number | null;
  maxHours: number;
  advanceDays: number;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/bookings`;

  listAreas(): Observable<CommonArea[]> {
    return this.http
      .get<ApiResponse<CommonArea[]>>(`${this.baseUrl}/areas`)
      .pipe(map((res) => res.data));
  }

  listBookings(page = 0, size = 20): Observable<PageResponse<Booking>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http
      .get<ApiResponse<PageResponse<Booking>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getSchedule(areaId: string, from: string, to: string): Observable<Booking[]> {
    const params = new HttpParams().set('areaId', areaId).set('from', from).set('to', to);
    return this.http
      .get<ApiResponse<Booking[]>>(`${this.baseUrl}/schedule`, { params })
      .pipe(map((res) => res.data));
  }

  createBooking(req: CreateBookingRequest): Observable<Booking> {
    return this.http.post<ApiResponse<Booking>>(this.baseUrl, req).pipe(map((res) => res.data));
  }

  confirmBooking(id: string): Observable<Booking> {
    return this.http
      .put<ApiResponse<Booking>>(`${this.baseUrl}/${id}/confirm`, {})
      .pipe(map((res) => res.data));
  }

  cancelBooking(id: string, reason: string): Observable<Booking> {
    return this.http
      .put<ApiResponse<Booking>>(`${this.baseUrl}/${id}/cancel`, { reason })
      .pipe(map((res) => res.data));
  }

  createCommonArea(req: CreateCommonAreaRequest): Observable<CommonArea> {
    return this.http
      .post<ApiResponse<CommonArea>>(`${this.baseUrl}/areas`, req)
      .pipe(map((res) => res.data));
  }

  updateCommonArea(id: string, req: CreateCommonAreaRequest): Observable<CommonArea> {
    return this.http
      .put<ApiResponse<CommonArea>>(`${this.baseUrl}/areas/${id}`, req)
      .pipe(map((res) => res.data));
  }
}
