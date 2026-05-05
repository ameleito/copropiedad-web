import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { UserProfile } from '../../core/models/user.model';

export interface CreateResidentRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  idDocument?: string;
  unitId?: string;
}

@Injectable({ providedIn: 'root' })
export class ResidentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  listAdmin(towerId?: string, interiorId?: string, unitId?: string): Observable<UserProfile[]> {
    let params = new HttpParams();
    if (towerId) params = params.set('towerId', towerId);
    if (interiorId) params = params.set('interiorId', interiorId);
    if (unitId) params = params.set('unitId', unitId);
    return this.http
      .get<ApiResponse<UserProfile[]>>(`${this.base}/admin/residents`, { params })
      .pipe(map(r => r.data ?? []));
  }

  createAdmin(req: CreateResidentRequest): Observable<UserProfile> {
    return this.http
      .post<ApiResponse<UserProfile>>(`${this.base}/admin/residents`, { ...req, role: 'RESIDENT' })
      .pipe(map(r => r.data!));
  }

  myUnit(): Observable<UserProfile[]> {
    return this.http
      .get<ApiResponse<UserProfile[]>>(`${this.base}/residents/my-unit`)
      .pipe(map(r => r.data ?? []));
  }

  addToMyUnit(req: CreateResidentRequest): Observable<UserProfile> {
    return this.http
      .post<ApiResponse<UserProfile>>(`${this.base}/residents/my-unit`, { ...req, role: 'RESIDENT' })
      .pipe(map(r => r.data!));
  }
}
