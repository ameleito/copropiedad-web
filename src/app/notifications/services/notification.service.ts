import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationItem, UnreadCount } from '../../core/models/notification.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/notifications`;

  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  list(page = 0, size = 20): Observable<PageResponse<NotificationItem>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<NotificationItem>>>(this.base, { params })
      .pipe(map((r) => r.data));
  }

  fetchUnreadCount(): void {
    this.http
      .get<ApiResponse<UnreadCount>>(`${this.base}/unread-count`)
      .pipe(map((r) => r.data.count))
      .subscribe({
        next: (count) => this._unreadCount.set(count),
        error: () => {},
      });
  }

  markAsRead(id: string): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.base}/${id}/read`, {})
      .pipe(
        map(() => void 0),
        tap(() => this._unreadCount.update((c) => Math.max(0, c - 1))),
      );
  }

  markAllAsRead(): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.base}/read-all`, {})
      .pipe(
        map(() => void 0),
        tap(() => this._unreadCount.set(0)),
      );
  }
}
