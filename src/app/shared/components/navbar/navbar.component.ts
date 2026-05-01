import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, OnDestroy, Output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../notifications/services/notification.service';
import { NotificationPanelComponent } from '../../../notifications/panel/notification-panel.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    NotificationPanelComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();

  protected readonly auth = inject(AuthService);
  protected readonly notifService = inject(NotificationService);
  private readonly router = inject(Router);
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.notifService.fetchUnreadCount();
    this.pollInterval = setInterval(() => this.notifService.fetchUnreadCount(), 30000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  goProfile(): void {
    void this.router.navigateByUrl('/profile');
  }

  logout(): void {
    this.auth.logout();
  }
}
