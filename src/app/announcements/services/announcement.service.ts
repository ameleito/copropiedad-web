import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import {
  AnnouncementResponse,
  CreateAnnouncementRequest,
  PageResponse,
} from '../../core/models/announcement.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/announcements`;

  create(request: CreateAnnouncementRequest): Observable<AnnouncementResponse> {
    return this.http
      .post<ApiResponse<AnnouncementResponse>>(this.baseUrl, request)
      .pipe(map((res) => res.data));
  }

  list(page = 0, size = 20): Observable<PageResponse<AnnouncementResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<AnnouncementResponse>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<AnnouncementResponse> {
    return this.http
      .get<ApiResponse<AnnouncementResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  markAsRead(id: string): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.baseUrl}/${id}/read`, {})
      .pipe(map(() => undefined));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
