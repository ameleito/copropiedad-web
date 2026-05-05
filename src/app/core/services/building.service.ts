import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';

export interface PublicTower { id: string; name: string; totalFloors: number; }
export interface PublicInterior { id: string; name: string; towerId: string | null; towerName: string | null; }
export interface PublicUnit {
  id: string; number: string; floor: number | null; type: string;
  towerId: string | null; towerName: string | null;
  interiorId: string | null; interiorName: string | null;
}

export const SEED_BUILDING_ID = 'a0000000-0000-0000-0000-000000000001';

@Injectable({ providedIn: 'root' })
export class BuildingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}`;

  towers(): Observable<PublicTower[]> {
    return this.http
      .get<ApiResponse<PublicTower[]>>(`${this.base}/towers`)
      .pipe(map(r => r.data ?? []), catchError(() => of([])));
  }

  interiors(towerId?: string | null): Observable<PublicInterior[]> {
    let params = new HttpParams();
    if (towerId) params = params.set('towerId', towerId);
    return this.http
      .get<ApiResponse<PublicInterior[]>>(`${this.base}/interiors`, { params })
      .pipe(map(r => r.data ?? []), catchError(() => of([])));
  }

  units(towerId?: string | null, interiorId?: string | null): Observable<PublicUnit[]> {
    let params = new HttpParams();
    if (interiorId) params = params.set('interiorId', interiorId);
    else if (towerId) params = params.set('towerId', towerId);
    return this.http
      .get<ApiResponse<PublicUnit[]>>(`${this.base}/units`, { params })
      .pipe(map(r => r.data ?? []), catchError(() => of([])));
  }
}
