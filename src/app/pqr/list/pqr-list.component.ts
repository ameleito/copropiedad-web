import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import {
  PQR_STATUS_COLORS,
  PQR_STATUS_LABELS,
  PQR_CATEGORY_LABELS,
  PQR_PRIORITY_LABELS,
  PQR_TIPO_LABELS,
  PqrResponse,
  PqrStatus,
} from '../../core/models/pqr.model';
import { PqrService } from '../services/pqr.service';

export type PqrListStatusFilter = PqrStatus | 'ALL';

const STATUS_FLOW: PqrStatus[] = [
  'RADICADO',
  'EN_GESTION',
  'ASIGNADO',
  'EN_EJECUCION',
  'RESUELTO',
  'CERRADO',
];

@Component({
  selector: 'app-pqr-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatBadgeModule,
  ],
  templateUrl: './pqr-list.component.html',
  styleUrl: './pqr-list.component.scss',
})
export class PqrListComponent {
  private readonly pqrService = inject(PqrService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly items = signal<PqrResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly statusFilter = signal<PqrListStatusFilter>('ALL');
  readonly loadError = signal<string | null>(null);

  readonly labels = {
    status: PQR_STATUS_LABELS,
    category: PQR_CATEGORY_LABELS,
    priority: PQR_PRIORITY_LABELS,
    tipo: PQR_TIPO_LABELS,
  };

  readonly statusColors = PQR_STATUS_COLORS;

  readonly filterChips: { value: PqrListStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'RADICADO', label: 'Radicado' },
    { value: 'EN_GESTION', label: 'En Gestión' },
    { value: 'ASIGNADO', label: 'Asignado' },
    { value: 'EN_EJECUCION', label: 'En Ejecución' },
    { value: 'RESUELTO', label: 'Resuelto' },
    { value: 'CERRADO', label: 'Cerrado' },
    { value: 'RECHAZADO', label: 'Rechazado' },
  ];

  readonly showFab = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'RESIDENT' || role === 'ADMIN';
  });

  readonly isResident = computed(() => this.auth.user()?.role === 'RESIDENT');

  constructor() {
    this.loadPqrs();
  }

  chipActive(value: PqrListStatusFilter): boolean {
    return this.statusFilter() === value;
  }

  setStatusFilter(value: PqrListStatusFilter): void {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
    this.loadPqrs();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadPqrs();
  }

  onPageSizeSelect(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.loadPqrs();
  }

  openCard(pqr: PqrResponse): void {
    void this.router.navigate(['/pqr', pqr.id]);
  }

  createNew(): void {
    void this.router.navigate(['/pqr', 'new']);
  }

  statusChipStyle(status: PqrStatus): { [key: string]: string } {
    const bg = PQR_STATUS_COLORS[status];
    return {
      'background-color': bg,
      color: '#fff',
    };
  }

  /** Pasos visibles en la tarjeta (residente): hasta el estado actual en el flujo normal. */
  timelineSteps(pqr: PqrResponse): PqrStatus[] {
    if (pqr.status === 'RECHAZADO') {
      return ['RADICADO', 'RECHAZADO'];
    }
    const idx = STATUS_FLOW.indexOf(pqr.status);
    if (idx === -1) {
      return [pqr.status];
    }
    return STATUS_FLOW.slice(0, idx + 1);
  }

  isTimelineActive(pqr: PqrResponse, step: PqrStatus): boolean {
    return pqr.status === step;
  }

  private loadPqrs(): void {
    this.loading.set(true);
    this.loadError.set(null);
    const filter = this.statusFilter();
    const statusParam = filter === 'ALL' ? undefined : filter;

    this.pqrService
      .list(this.pageIndex(), this.pageSize(), statusParam)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar las solicitudes. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
