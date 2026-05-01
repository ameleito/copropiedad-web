import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { ParkingLogEntry, ParkingSpot, VehicleInfo } from '../../core/models/parking.model';
import { PageResponse } from '../../core/models/visitor.model';

export interface RegisterVehicleRequest {
  plate: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
}

export interface LogEntryRequest {
  spotId?: string | null;
  plate: string;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ParkingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/parking`;

  listSpots(): Observable<ParkingSpot[]> {
    return this.http
      .get<ApiResponse<ParkingSpot[]>>(`${this.baseUrl}/spots`)
      .pipe(map((res) => res.data));
  }

  listVehicles(): Observable<VehicleInfo[]> {
    return this.http
      .get<ApiResponse<VehicleInfo[]>>(`${this.baseUrl}/vehicles`)
      .pipe(map((res) => res.data));
  }

  registerVehicle(request: RegisterVehicleRequest): Observable<VehicleInfo> {
    return this.http
      .post<ApiResponse<VehicleInfo>>(`${this.baseUrl}/vehicles`, request)
      .pipe(map((res) => res.data));
  }

  listLog(page: number, size: number): Observable<PageResponse<ParkingLogEntry>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<ParkingLogEntry>>>(`${this.baseUrl}/log`, { params })
      .pipe(map((res) => res.data));
  }

  logEntry(request: LogEntryRequest): Observable<ParkingLogEntry> {
    const body: { plate: string; notes: string | null; spotId?: string } = {
      plate: request.plate,
      notes: request.notes ?? null,
    };
    if (request.spotId) {
      body.spotId = request.spotId;
    }
    return this.http
      .post<ApiResponse<ParkingLogEntry>>(`${this.baseUrl}/log/entry`, body)
      .pipe(map((res) => res.data));
  }

  logExit(id: string): Observable<ParkingLogEntry> {
    return this.http
      .put<ApiResponse<ParkingLogEntry>>(`${this.baseUrl}/log/${id}/exit`, {})
      .pipe(map((res) => res.data));
  }
}
