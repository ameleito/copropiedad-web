import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import {
  AssignPqrRequest,
  CreatePqrRequest,
  PageResponse,
  PqrHistoryEntry,
  PqrResponse,
  UpdatePqrStatusRequest,
} from '../../core/models/pqr.model';

@Injectable({ providedIn: 'root' })
export class PqrService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/pqr`;

  create(request: CreatePqrRequest, photos?: File[]): Observable<PqrResponse> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (photos) {
      photos.forEach((file) => formData.append('photos', file));
    }
    return this.http
      .post<ApiResponse<PqrResponse>>(this.baseUrl, formData)
      .pipe(map((res) => res.data));
  }

  list(page = 0, size = 20, status?: string): Observable<PageResponse<PqrResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<PageResponse<PqrResponse>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<PqrResponse> {
    return this.http
      .get<ApiResponse<PqrResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  assign(id: string, request: AssignPqrRequest): Observable<PqrResponse> {
    return this.http
      .put<ApiResponse<PqrResponse>>(`${this.baseUrl}/${id}/assign`, request)
      .pipe(map((res) => res.data));
  }

  updateStatus(id: string, request: UpdatePqrStatusRequest): Observable<PqrResponse> {
    return this.http
      .put<ApiResponse<PqrResponse>>(`${this.baseUrl}/${id}/status`, request)
      .pipe(map((res) => res.data));
  }

  getHistory(id: string): Observable<PqrHistoryEntry[]> {
    return this.http
      .get<ApiResponse<PqrHistoryEntry[]>>(`${this.baseUrl}/${id}/history`)
      .pipe(map((res) => res.data));
  }

  uploadPhotos(id: string, photos: File[], phase = 'SUBMISSION'): Observable<PqrResponse> {
    const formData = new FormData();
    photos.forEach((file) => formData.append('photos', file));
    return this.http
      .post<ApiResponse<PqrResponse>>(`${this.baseUrl}/${id}/photos?phase=${phase}`, formData)
      .pipe(map((res) => res.data));
  }
}
