import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { MeterItem, MeterReadingItem } from '../../core/models/meter.model';
import { PageResponse } from '../../core/models/visitor.model';

export interface CreateMeterRequest {
  unitId: string;
  type: string;
  meterNumber?: string | null;
}

export interface RegisterReadingRequest {
  meterId: string;
  period: string;
  readingValue: number;
}

@Injectable({ providedIn: 'root' })
export class MeterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/meters`;

  listMeters(): Observable<MeterItem[]> {
    return this.http.get<ApiResponse<MeterItem[]>>(this.baseUrl).pipe(map((res) => res.data));
  }

  createMeter(req: CreateMeterRequest): Observable<MeterItem> {
    return this.http.post<ApiResponse<MeterItem>>(this.baseUrl, req).pipe(map((res) => res.data));
  }

  listReadings(meterId: string, page: number, size: number): Observable<PageResponse<MeterReadingItem>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<MeterReadingItem>>>(`${this.baseUrl}/${meterId}/readings`, { params })
      .pipe(map((res) => res.data));
  }

  registerReading(req: RegisterReadingRequest): Observable<MeterReadingItem> {
    return this.http
      .post<ApiResponse<MeterReadingItem>>(`${this.baseUrl}/readings`, req)
      .pipe(map((res) => res.data));
  }
}
