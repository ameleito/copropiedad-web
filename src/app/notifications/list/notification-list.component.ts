import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../services/notification.service';
import { NotificationItem } from '../../core/models/notification.model';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
})
export class NotificationListComponent implements OnInit {
  private readonly notifService = inject(NotificationService);

  notifications: NotificationItem[] = [];
  loading = false;
  totalElements = 0;
  pageSize = 20;
  currentPage = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.notifService.list(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.notifications = page.content;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onPage(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  markAsRead(notif: NotificationItem): void {
    if (notif.read) return;
    this.notifService.markAsRead(notif.id).subscribe({
      next: () => (notif.read = true),
    });
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.read = true));
      },
    });
  }

  iconForType(type: string): string {
    const map: Record<string, string> = {
      PQR_ASSIGNED: 'assignment_ind',
      PQR_STATUS_CHANGED: 'update',
      PACKAGE_ARRIVED: 'inventory_2',
      PACKAGE_READY: 'local_shipping',
      NEW_ANNOUNCEMENT: 'campaign',
      INVOICE_CREATED: 'receipt_long',
    };
    return map[type] || 'notifications';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
