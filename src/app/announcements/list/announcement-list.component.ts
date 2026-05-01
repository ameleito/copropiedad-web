import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import {
  AnnouncementResponse,
  SCOPE_ICONS,
  SCOPE_LABELS,
  AnnouncementScopeType,
} from '../../core/models/announcement.model';
import { AnnouncementService } from '../services/announcement.service';
import { AnnouncementCreateDialogComponent } from '../create/announcement-create-dialog.component';
import { AnnouncementDetailDialogComponent } from '../detail/announcement-detail-dialog.component';

type ReadFilter = 'ALL' | 'UNREAD' | 'READ';

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatDialogModule,
  ],
  templateUrl: './announcement-list.component.html',
  styleUrl: './announcement-list.component.scss',
})
export class AnnouncementListComponent {
  private readonly announcementService = inject(AnnouncementService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly items = signal<AnnouncementResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly readFilter = signal<ReadFilter>('ALL');
  readonly loadError = signal<string | null>(null);

  readonly scopeLabels = SCOPE_LABELS;
  readonly scopeIcons = SCOPE_ICONS;

  readonly filterChips: { value: ReadFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'UNREAD', label: 'Sin leer' },
    { value: 'READ', label: 'Leídos' },
  ];

  readonly isAdmin = computed(() => this.auth.getCurrentUser()?.role === 'ADMIN');

  readonly filteredItems = computed(() => {
    const filter = this.readFilter();
    const all = this.items();
    if (filter === 'UNREAD') return all.filter((a) => !a.read);
    if (filter === 'READ') return all.filter((a) => a.read);
    return all;
  });

  constructor() {
    this.loadAnnouncements();
  }

  chipActive(value: ReadFilter): boolean {
    return this.readFilter() === value;
  }

  setFilter(value: ReadFilter): void {
    this.readFilter.set(value);
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadAnnouncements();
  }

  openCreate(): void {
    const ref = this.dialog.open(AnnouncementCreateDialogComponent, {
      width: '560px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadAnnouncements();
    });
  }

  openDetail(announcement: AnnouncementResponse): void {
    const ref = this.dialog.open(AnnouncementDetailDialogComponent, {
      width: '600px',
      data: announcement,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadAnnouncements();
    });
  }

  deleteAnnouncement(a: AnnouncementResponse, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Está seguro de eliminar este anuncio?')) return;
    this.announcementService.delete(a.id).subscribe({
      next: () => this.loadAnnouncements(),
    });
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Justo ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Hace ${days}d`;
    return new Date(dateStr).toLocaleDateString('es-CO');
  }

  private loadAnnouncements(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.announcementService
      .list(this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar los anuncios. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
