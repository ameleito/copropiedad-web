import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import {
  PageResponse,
  PreregisterVisitorRequest,
  VisitorResponse,
  WalkInVisitorRequest,
} from '../../core/models/visitor.model';

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/visitors`;

  preregister(request: PreregisterVisitorRequest): Observable<VisitorResponse> {
    return this.http
      .post<ApiResponse<VisitorResponse>>(`${this.baseUrl}/preregister`, request)
      .pipe(map((res) => res.data));
  }

  walkIn(request: WalkInVisitorRequest): Observable<VisitorResponse> {
    return this.http
      .post<ApiResponse<VisitorResponse>>(`${this.baseUrl}/walkin`, request)
      .pipe(map((res) => res.data));
  }

  list(page = 0, size = 20, status?: string): Observable<PageResponse<VisitorResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiResponse<PageResponse<VisitorResponse>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<VisitorResponse> {
    return this.http
      .get<ApiResponse<VisitorResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  checkIn(id: string): Observable<VisitorResponse> {
    return this.http
      .put<ApiResponse<VisitorResponse>>(`${this.baseUrl}/${id}/checkin`, {})
      .pipe(map((res) => res.data));
  }

  checkOut(id: string): Observable<VisitorResponse> {
    return this.http
      .put<ApiResponse<VisitorResponse>>(`${this.baseUrl}/${id}/checkout`, {})
      .pipe(map((res) => res.data));
  }

  markNoShow(id: string): Observable<VisitorResponse> {
    return this.http
      .put<ApiResponse<VisitorResponse>>(`${this.baseUrl}/${id}/noshow`, {})
      .pipe(map((res) => res.data));
  }
}
