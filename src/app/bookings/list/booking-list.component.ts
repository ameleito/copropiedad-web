import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ThemePalette } from '@angular/material/core';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { Booking, CommonArea } from '../../core/models/booking.model';
import { BookingCancelDialogComponent } from '../cancel/booking-cancel-dialog.component';
import { BookingCreateDialogComponent } from '../create/booking-create-dialog.component';
import { CommonAreaCreateDialogComponent } from '../create/common-area-create-dialog.component';
import { BookingService } from '../services/booking.service';

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  EN_USO: 'En uso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTableModule,
  ],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss',
})
export class BookingListComponent {
  private readonly bookingService = inject(BookingService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly areas = signal<CommonArea[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly areasLoading = signal(false);
  readonly bookingsLoading = signal(false);
  readonly areasError = signal<string | null>(null);
  readonly bookingsError = signal<string | null>(null);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);

  readonly displayedColumns = ['area', 'datetime', 'status', 'unit', 'actions'];

  readonly isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');

  readonly statusLabels = STATUS_LABELS;

  constructor() {
    this.loadAreas();
    this.loadBookings();
  }

  statusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  statusChipColor(status: string): ThemePalette | undefined {
    switch (status) {
      case 'PENDIENTE':
        return 'warn';
      case 'CONFIRMADA':
        return 'primary';
      case 'EN_USO':
        return 'accent';
      case 'COMPLETADA':
        return undefined;
      case 'CANCELADA':
        return 'warn';
      default:
        return undefined;
    }
  }

  confirmBooking(booking: Booking): void {
    this.bookingService.confirmBooking(booking.id).subscribe({
      next: () => this.loadBookings(),
      error: () => {},
    });
  }

  openReserve(area: CommonArea): void {
    const ref = this.dialog.open(BookingCreateDialogComponent, {
      width: '520px',
      disableClose: true,
      data: { commonArea: area },
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadBookings();
    });
  }

  openCreateArea(): void {
    const ref = this.dialog.open(CommonAreaCreateDialogComponent, {
      width: '520px',
      disableClose: true,
      data: {},
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadAreas();
    });
  }

  openEditArea(area: CommonArea): void {
    const ref = this.dialog.open(CommonAreaCreateDialogComponent, {
      width: '520px',
      disableClose: true,
      data: { area },
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) this.loadAreas();
    });
  }

  requestCancel(booking: Booking): void {
    const ref = this.dialog.open(BookingCancelDialogComponent, { width: '400px' });
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.bookingService.cancelBooking(booking.id, reason).subscribe({
        next: () => this.loadBookings(),
        error: () => {},
      });
    });
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadBookings();
  }

  private loadAreas(): void {
    this.areasLoading.set(true);
    this.areasError.set(null);
    this.bookingService
      .listAreas()
      .pipe(finalize(() => this.areasLoading.set(false)))
      .subscribe({
        next: (list) => this.areas.set(list ?? []),
        error: () => {
          this.areasError.set('No se pudieron cargar las áreas comunes.');
          this.areas.set([]);
        },
      });
  }

  private loadBookings(): void {
    this.bookingsLoading.set(true);
    this.bookingsError.set(null);
    this.bookingService
      .listBookings(this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.bookingsLoading.set(false)))
      .subscribe({
        next: (page) => {
          this.bookings.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.bookingsError.set('No se pudieron cargar las reservas.');
          this.bookings.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
