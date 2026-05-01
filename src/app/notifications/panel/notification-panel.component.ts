import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../services/notification.service';
import { NotificationItem } from '../../core/models/notification.model';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanelComponent implements OnInit {
  protected readonly notifService = inject(NotificationService);

  notifications: NotificationItem[] = [];
  loading = false;
  totalPages = 0;
  currentPage = 0;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notifService.list(this.currentPage, 15).subscribe({
      next: (page) => {
        this.notifications = page.content;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  markAsRead(notif: NotificationItem): void {
    if (notif.read) return;
    this.notifService.markAsRead(notif.id).subscribe({
      next: () => (notif.read = true),
    });
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => this.notifications.forEach((n) => (n.read = true)),
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

  timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days}d`;
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  }
}
