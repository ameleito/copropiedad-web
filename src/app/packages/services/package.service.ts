import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import {
  DeliverPackageRequest,
  PackageResponse,
  PageResponse,
  ReceivePackageRequest,
} from '../../core/models/package.model';

@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/packages`;

  receive(request: ReceivePackageRequest): Observable<PackageResponse> {
    return this.http
      .post<ApiResponse<PackageResponse>>(this.baseUrl, request)
      .pipe(map((res) => res.data));
  }

  list(
    page = 0,
    size = 20,
    status?: string,
    unitNumber?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Observable<PageResponse<PackageResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status)     params = params.set('status', status);
    if (unitNumber) params = params.set('unitNumber', unitNumber);
    if (dateFrom)   params = params.set('dateFrom', dateFrom);
    if (dateTo)     params = params.set('dateTo', dateTo);
    return this.http
      .get<ApiResponse<PageResponse<PackageResponse>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<PackageResponse> {
    return this.http
      .get<ApiResponse<PackageResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  notifyResident(id: string): Observable<PackageResponse> {
    return this.http
      .put<ApiResponse<PackageResponse>>(`${this.baseUrl}/${id}/notify`, {})
      .pipe(map((res) => res.data));
  }

  deliver(id: string, request: DeliverPackageRequest): Observable<PackageResponse> {
    return this.http
      .put<ApiResponse<PackageResponse>>(`${this.baseUrl}/${id}/deliver`, request)
      .pipe(map((res) => res.data));
  }
}
