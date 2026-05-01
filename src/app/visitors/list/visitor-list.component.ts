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
  VIS_STATUS_COLORS,
  VIS_STATUS_ICONS,
  VIS_STATUS_LABELS,
  VisitorResponse,
  VisitorStatusType,
} from '../../core/models/visitor.model';
import { VisitorService } from '../services/visitor.service';
import { VisitorRegisterDialogComponent } from '../register/visitor-register-dialog.component';

type StatusFilter = VisitorStatusType | 'ALL';

@Component({
  selector: 'app-visitor-list',
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
  templateUrl: './visitor-list.component.html',
  styleUrl: './visitor-list.component.scss',
})
export class VisitorListComponent {
  private readonly visitorService = inject(VisitorService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly items = signal<VisitorResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly loadError = signal<string | null>(null);

  readonly labels = VIS_STATUS_LABELS;
  readonly colors = VIS_STATUS_COLORS;
  readonly icons = VIS_STATUS_ICONS;

  readonly filterChips: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'ESPERADO', label: 'Esperado' },
    { value: 'INGRESADO', label: 'Ingresado' },
    { value: 'SALIDO', label: 'Salió' },
    { value: 'NO_SE_PRESENTO', label: 'No se presentó' },
  ];

  readonly isSecurity = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'SECURITY' || role === 'ADMIN';
  });

  constructor() {
    this.loadVisitors();
  }

  chipActive(value: StatusFilter): boolean {
    return this.statusFilter() === value;
  }

  setFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
    this.loadVisitors();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadVisitors();
  }

  statusChipStyle(status: VisitorStatusType): Record<string, string> {
    return { 'background-color': this.colors[status], color: '#fff' };
  }

  openRegister(): void {
    const ref = this.dialog.open(VisitorRegisterDialogComponent, {
      width: '480px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadVisitors();
    });
  }

  checkIn(v: VisitorResponse, event: Event): void {
    event.stopPropagation();
    this.visitorService.checkIn(v.id).subscribe({ next: () => this.loadVisitors() });
  }

  checkOut(v: VisitorResponse, event: Event): void {
    event.stopPropagation();
    this.visitorService.checkOut(v.id).subscribe({ next: () => this.loadVisitors() });
  }

  markNoShow(v: VisitorResponse, event: Event): void {
    event.stopPropagation();
    this.visitorService.markNoShow(v.id).subscribe({ next: () => this.loadVisitors() });
  }

  private loadVisitors(): void {
    this.loading.set(true);
    this.loadError.set(null);
    const filter = this.statusFilter();
    const statusParam = filter === 'ALL' ? undefined : filter;

    this.visitorService
      .list(this.pageIndex(), this.pageSize(), statusParam)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar los visitantes. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
