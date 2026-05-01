import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { CreateDocumentRequest, DocItem } from '../../core/models/document.model';
import { PageResponse } from '../../core/models/visitor.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/documents`;

  listDocuments(page = 0, size = 20, category?: string): Observable<PageResponse<DocItem>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (category) {
      params = params.set('category', category);
    }
    return this.http
      .get<ApiResponse<PageResponse<DocItem>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  createDocument(request: CreateDocumentRequest): Observable<DocItem> {
    return this.http
      .post<ApiResponse<DocItem>>(this.baseUrl, request)
      .pipe(map((res) => res.data));
  }

  deleteDocument(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
