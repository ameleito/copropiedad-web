import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { CreateUnitRequest, UnitResponse, UpdateUnitRequest } from '../../core/models/unit.model';

@Injectable({ providedIn: 'root' })
export class UnitService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin`;

  listUnits(): Observable<UnitResponse[]> {
    return this.http
      .get<ApiResponse<UnitResponse[]>>(`${this.baseUrl}/units`)
      .pipe(map((res) => res.data));
  }

  create(request: CreateUnitRequest): Observable<UnitResponse> {
    return this.http
      .post<ApiResponse<UnitResponse>>(`${this.baseUrl}/units`, request)
      .pipe(map((res) => res.data));
  }

  update(id: string, request: UpdateUnitRequest): Observable<UnitResponse> {
    return this.http
      .put<ApiResponse<UnitResponse>>(`${this.baseUrl}/units/${id}`, request)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/units/${id}`)
      .pipe(map(() => undefined));
  }
}
