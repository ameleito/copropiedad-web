import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { InteriorResponse, CreateInteriorRequest, UpdateInteriorRequest } from '../../core/models/interior.model';

@Injectable({ providedIn: 'root' })
export class InteriorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/interiors`;

  list(towerId?: string | null): Observable<InteriorResponse[]> {
    let params = new HttpParams();
    if (towerId) params = params.set('towerId', towerId);
    return this.http
      .get<ApiResponse<InteriorResponse[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  create(request: CreateInteriorRequest): Observable<InteriorResponse> {
    return this.http
      .post<ApiResponse<InteriorResponse>>(this.baseUrl, request)
      .pipe(map((res) => res.data));
  }

  update(id: string, request: UpdateInteriorRequest): Observable<InteriorResponse> {
    return this.http
      .put<ApiResponse<InteriorResponse>>(`${this.baseUrl}/${id}`, request)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
