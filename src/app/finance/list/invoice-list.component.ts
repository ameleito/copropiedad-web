import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
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
  INV_STATUS_COLORS,
  INV_STATUS_ICONS,
  INV_STATUS_LABELS,
  InvoiceResponse,
  InvoiceStatusType,
} from '../../core/models/finance.model';
import { FinanceService } from '../services/finance.service';
import { InvoiceCreateDialogComponent } from '../create/invoice-create-dialog.component';
import { InvoiceDetailDialogComponent } from '../detail/invoice-detail-dialog.component';

type StatusFilter = InvoiceStatusType | 'ALL';

@Component({
  selector: 'app-invoice-list',
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
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
})
export class InvoiceListComponent {
  private readonly financeService = inject(FinanceService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly items = signal<InvoiceResponse[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly loadError = signal<string | null>(null);

  readonly labels = INV_STATUS_LABELS;
  readonly colors = INV_STATUS_COLORS;
  readonly icons = INV_STATUS_ICONS;

  readonly filterChips: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'PAGADA', label: 'Pagada' },
    { value: 'VENCIDA', label: 'Vencida' },
    { value: 'ANULADA', label: 'Anulada' },
  ];

  readonly isAdmin = computed(() => {
    const role = this.auth.getCurrentUser()?.role;
    return role === 'ADMIN' || role === 'FINANCE';
  });

  constructor() {
    this.loadInvoices();
  }

  chipActive(value: StatusFilter): boolean {
    return this.statusFilter() === value;
  }

  setFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
    this.loadInvoices();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadInvoices();
  }

  statusChipStyle(status: InvoiceStatusType): Record<string, string> {
    return { 'background-color': this.colors[status], color: '#fff' };
  }

  openCreate(): void {
    const ref = this.dialog.open(InvoiceCreateDialogComponent, {
      width: '560px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadInvoices();
    });
  }

  openDetail(inv: InvoiceResponse): void {
    const ref = this.dialog.open(InvoiceDetailDialogComponent, {
      width: '600px',
      data: inv,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadInvoices();
    });
  }

  formatPeriod(period: string): string {
    const [y, m] = period.trim().split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  private loadInvoices(): void {
    this.loading.set(true);
    this.loadError.set(null);
    const filter = this.statusFilter();
    const statusParam = filter === 'ALL' ? undefined : filter;

    this.financeService
      .listInvoices(this.pageIndex(), this.pageSize(), statusParam)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar las facturas. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
