import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { PageResponse } from '../../core/models/announcement.model';
import {
  ConversationItem,
  CreateConversationRequest,
  MessageItem,
} from '../../core/models/messaging.model';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/messaging`;

  listConversations(): Observable<ConversationItem[]> {
    return this.http
      .get<ApiResponse<ConversationItem[]>>(`${this.baseUrl}/conversations`)
      .pipe(map((res) => res.data ?? []));
  }

  createConversation(req: CreateConversationRequest): Observable<ConversationItem> {
    return this.http
      .post<ApiResponse<ConversationItem>>(`${this.baseUrl}/conversations`, req)
      .pipe(map((res) => res.data as ConversationItem));
  }

  getMessages(convId: string, page: number, size: number): Observable<PageResponse<MessageItem>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<MessageItem>>>(`${this.baseUrl}/conversations/${convId}/messages`, {
        params,
      })
      .pipe(map((res) => res.data as PageResponse<MessageItem>));
  }

  sendMessage(convId: string, body: string): Observable<MessageItem> {
    return this.http
      .post<ApiResponse<MessageItem>>(`${this.baseUrl}/conversations/${convId}/messages`, { body })
      .pipe(map((res) => res.data as MessageItem));
  }
}
