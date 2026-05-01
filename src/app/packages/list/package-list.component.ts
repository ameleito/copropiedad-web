import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import {
  PKG_STATUS_COLORS,
  PKG_STATUS_ICONS,
  PKG_STATUS_LABELS,
  PackageResponse,
  PackageStatusType,
} from '../../core/models/package.model';
import { PackageService } from '../services/package.service';
import { PackageDeliverDialogComponent } from '../deliver/package-deliver-dialog.component';
import { PackageReceiveDialogComponent } from '../receive/package-receive-dialog.component';

type StatusFilter = PackageStatusType | 'ALL';

@Component({
  selector: 'app-package-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './package-list.component.html',
  styleUrl: './package-list.component.scss',
})
export class PackageListComponent {
  private readonly pkgService = inject(PackageService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly items = signal<PackageResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly loadError = signal<string | null>(null);

  readonly labels = PKG_STATUS_LABELS;
  readonly colors = PKG_STATUS_COLORS;
  readonly icons = PKG_STATUS_ICONS;

  readonly filterForm = this.fb.group({
    unitNumber: [''],
    dateFrom: [''],
    dateTo: [''],
  });

  readonly filterChips: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'RECIBIDO', label: 'Recibido' },
    { value: 'NOTIFICADO', label: 'Notificado' },
    { value: 'ENTREGADO', label: 'Entregado' },
  ];

  readonly canReceive = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'SECURITY' || role === 'ADMIN';
  });

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'SECURITY' || role === 'ADMIN';
  });

  constructor() {
    this.loadPackages();
    this.filterForm.valueChanges
      .pipe(debounceTime(400))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadPackages();
      });
  }

  chipActive(value: StatusFilter): boolean {
    return this.statusFilter() === value;
  }

  setFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
    this.loadPackages();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadPackages();
  }

  statusChipStyle(status: PackageStatusType): Record<string, string> {
    return { 'background-color': this.colors[status], color: '#fff' };
  }

  openReceive(): void {
    const ref = this.dialog.open(PackageReceiveDialogComponent, {
      width: '480px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadPackages();
    });
  }

  notifyResident(pkg: PackageResponse, event: Event): void {
    event.stopPropagation();
    this.pkgService.notifyResident(pkg.id).subscribe({
      next: () => this.loadPackages(),
    });
  }

  openDeliver(pkg: PackageResponse, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(PackageDeliverDialogComponent, {
      width: '400px',
      data: { packageId: pkg.id, unitId: pkg.unitId },
    });
    ref.afterClosed().subscribe((delivered) => {
      if (delivered) this.loadPackages();
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ unitNumber: '', dateFrom: '', dateTo: '' });
  }

  private loadPackages(): void {
    this.loading.set(true);
    this.loadError.set(null);

    const filter = this.statusFilter();
    const statusParam = filter === 'ALL' ? undefined : filter;
    const { unitNumber, dateFrom, dateTo } = this.filterForm.value;

    this.pkgService
      .list(
        this.pageIndex(),
        this.pageSize(),
        statusParam,
        unitNumber || undefined,
        dateFrom || undefined,
        dateTo || undefined,
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar los paquetes. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
