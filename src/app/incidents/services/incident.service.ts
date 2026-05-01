import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { PageResponse } from '../../core/models/announcement.model';
import { CreateIncidentRequest, Incident } from '../../core/models/incident.model';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/incidents`;

  list(filter?: string, page = 0, size = 20): Observable<PageResponse<Incident>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (filter) {
      params = params.set('filter', filter);
    }
    return this.http
      .get<ApiResponse<PageResponse<Incident>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  create(req: CreateIncidentRequest): Observable<Incident> {
    return this.http
      .post<ApiResponse<Incident>>(this.baseUrl, req)
      .pipe(map((res) => res.data));
  }

  resolve(id: string, notes: string): Observable<Incident> {
    return this.http
      .put<ApiResponse<Incident>>(`${this.baseUrl}/${id}/resolve`, { resolutionNotes: notes })
      .pipe(map((res) => res.data));
  }
}
