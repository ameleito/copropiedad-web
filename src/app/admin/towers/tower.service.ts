import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { TowerResponse, CreateTowerRequest, UpdateTowerRequest } from '../../core/models/tower.model';

@Injectable({ providedIn: 'root' })
export class TowerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/towers`;

  list(): Observable<TowerResponse[]> {
    return this.http
      .get<ApiResponse<TowerResponse[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  create(request: CreateTowerRequest): Observable<TowerResponse> {
    return this.http
      .post<ApiResponse<TowerResponse>>(this.baseUrl, request)
      .pipe(map((res) => res.data));
  }

  update(id: string, request: UpdateTowerRequest): Observable<TowerResponse> {
    return this.http
      .put<ApiResponse<TowerResponse>>(`${this.baseUrl}/${id}`, request)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
