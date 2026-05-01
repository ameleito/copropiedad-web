import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { AuthService } from '../../auth/services/auth.service';
import {
  PQR_CATEGORY_LABELS,
  PQR_PRIORITY_LABELS,
  PQR_STATUS_COLORS,
  PQR_STATUS_LABELS,
  PQR_TIPO_LABELS,
  PqrHistoryEntry,
  PqrResponse,
  PqrStatus,
} from '../../core/models/pqr.model';
import { PqrService } from '../services/pqr.service';

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

const ALL_STATUSES: PqrStatus[] = [
  'RADICADO',
  'EN_GESTION',
  'ASIGNADO',
  'EN_EJECUCION',
  'RESUELTO',
  'CERRADO',
  'RECHAZADO',
];

function maintenanceNextStatuses(current: PqrStatus): PqrStatus[] {
  switch (current) {
    case 'EN_GESTION':
      return ['ASIGNADO', 'EN_EJECUCION'];
    case 'ASIGNADO':
      return ['EN_EJECUCION', 'RESUELTO'];
    case 'EN_EJECUCION':
      return ['RESUELTO'];
    default:
      return [];
  }
}

@Component({
  selector: 'app-pqr-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './pqr-detail.component.html',
  styleUrl: './pqr-detail.component.scss',
})
export class PqrDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pqrService = inject(PqrService);
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pqr = signal<PqrResponse | null>(null);
  readonly history = signal<PqrHistoryEntry[]>([]);
  readonly isNewPlaceholder = signal(false);
  readonly maintenanceUsers = signal<StaffUser[]>([]);

  readonly labels = {
    status: PQR_STATUS_LABELS,
    category: PQR_CATEGORY_LABELS,
    priority: PQR_PRIORITY_LABELS,
    tipo: PQR_TIPO_LABELS,
  };

  readonly statusColors = PQR_STATUS_COLORS;

  readonly assigneeId = signal('');
  readonly assignComment = signal('');
  readonly assigning = signal(false);

  readonly adminStatus = signal<PqrStatus | ''>('');
  readonly adminComment = signal('');
  readonly adminRejectionReason = signal('');
  readonly adminStatusSaving = signal(false);

  readonly maintStatus = signal<PqrStatus | ''>('');
  readonly maintComment = signal('');
  readonly maintSaving = signal(false);

  readonly closeRating = signal<number | null>(null);
  readonly closeComment = signal('');
  readonly closing = signal(false);

  readonly isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');
  readonly isMaintenance = computed(() => this.auth.user()?.role === 'MAINTENANCE');
  readonly isResident = computed(() => this.auth.user()?.role === 'RESIDENT');

  readonly sortedHistory = computed(() => {
    const h = [...this.history()];
    return h.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  readonly maintNextOptions = computed(() => {
    const current = this.pqr()?.status;
    if (!current) return [] as PqrStatus[];
    return maintenanceNextStatuses(current);
  });

  readonly showResidentClose = computed(() => {
    return this.isResident() && this.pqr()?.status === 'RESUELTO';
  });

  readonly allStatusesList = ALL_STATUSES;

  readonly satisfactionOptions = [5, 4, 3, 2, 1] as const;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Identificador no válido.');
      this.loading.set(false);
      return;
    }
    if (id === 'new') {
      this.isNewPlaceholder.set(true);
      this.loading.set(false);
      return;
    }
    this.loadDetail(id);
    if (this.auth.user()?.role === 'ADMIN') {
      this.loadMaintenanceUsers();
    }
  }

  statusChipStyle(status: PqrStatus): { [key: string]: string } {
    const bg = PQR_STATUS_COLORS[status];
    return { 'background-color': bg, color: '#fff' };
  }

  historyStatusLabel(code: string): string {
    const key = code as PqrStatus;
    return PQR_STATUS_LABELS[key] ?? code;
  }

  goBack(): void {
    void this.router.navigateByUrl('/pqr');
  }

  submitAssign(): void {
    const id = this.pqr()?.id;
    const assignee = this.assigneeId().trim();
    if (!id || !assignee) return;
    this.error.set(null);
    this.assigning.set(true);
    this.pqrService
      .assign(id, { assigneeId: assignee, comment: this.assignComment().trim() || undefined })
      .pipe(finalize(() => this.assigning.set(false)))
      .subscribe({
        next: (updated) => {
          this.pqr.set(updated);
          this.assigneeId.set('');
          this.assignComment.set('');
          this.error.set(null);
          this.reloadHistory(id);
        },
        error: () => this.error.set('No se pudo asignar. Verifique el ID del usuario.'),
      });
  }

  submitAdminStatus(): void {
    const id = this.pqr()?.id;
    const status = this.adminStatus();
    if (!id || !status) return;
    if (status === 'RECHAZADO' && !this.adminRejectionReason().trim()) {
      this.error.set('Indique el motivo del rechazo.');
      return;
    }
    this.error.set(null);
    this.adminStatusSaving.set(true);
    this.pqrService
      .updateStatus(id, {
        status,
        comment: this.adminComment().trim() || undefined,
        rejectionReason: status === 'RECHAZADO' ? this.adminRejectionReason().trim() : undefined,
      })
      .pipe(finalize(() => this.adminStatusSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.pqr.set(updated);
          this.adminStatus.set('');
          this.adminComment.set('');
          this.adminRejectionReason.set('');
          this.error.set(null);
          this.reloadHistory(id);
        },
        error: () => this.error.set('No se pudo actualizar el estado.'),
      });
  }

  submitMaintenanceStatus(): void {
    const id = this.pqr()?.id;
    const status = this.maintStatus();
    if (!id || !status) return;
    this.error.set(null);
    this.maintSaving.set(true);
    this.pqrService
      .updateStatus(id, {
        status,
        comment: this.maintComment().trim() || undefined,
      })
      .pipe(finalize(() => this.maintSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.pqr.set(updated);
          this.maintStatus.set('');
          this.maintComment.set('');
          this.error.set(null);
          this.reloadHistory(id);
        },
        error: () => this.error.set('No se pudo actualizar el estado.'),
      });
  }

  submitClose(): void {
    const id = this.pqr()?.id;
    const rating = this.closeRating();
    if (!id || rating == null) {
      this.error.set('Seleccione una calificación de satisfacción.');
      return;
    }
    this.error.set(null);
    this.closing.set(true);
    this.pqrService
      .updateStatus(id, {
        status: 'CERRADO',
        satisfactionRating: rating,
        satisfactionComment: this.closeComment().trim() || undefined,
      })
      .pipe(finalize(() => this.closing.set(false)))
      .subscribe({
        next: (updated) => {
          this.pqr.set(updated);
          this.closeRating.set(null);
          this.closeComment.set('');
          this.error.set(null);
          this.reloadHistory(id);
        },
        error: () => this.error.set('No se pudo cerrar la solicitud.'),
      });
  }

  private loadDetail(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      pqr: this.pqrService.getById(id),
      history: this.pqrService.getHistory(id),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ pqr, history }) => {
          this.pqr.set(pqr);
          this.history.set(history ?? []);
        },
        error: () => {
          this.error.set('No se pudo cargar el detalle de la solicitud.');
          this.pqr.set(null);
          this.history.set([]);
        },
      });
  }

  private reloadHistory(id: string): void {
    this.pqrService.getHistory(id).subscribe({
      next: (h) => this.history.set(h ?? []),
      error: () => {},
    });
  }

  private loadMaintenanceUsers(): void {
    this.http
      .get<ApiResponse<StaffUser[]>>(`${environment.apiUrl}/api/users`, {
        params: { role: 'MAINTENANCE' },
      })
      .subscribe({
        next: (res) => this.maintenanceUsers.set(res.data ?? []),
        error: () => {},
      });
  }
}
