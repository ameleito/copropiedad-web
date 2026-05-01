import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { ParkingLogEntry, ParkingSpot, VehicleInfo } from '../../core/models/parking.model';
import { ParkingEntryDialogComponent } from '../entry/parking-entry-dialog.component';
import { VehicleRegisterDialogComponent } from '../register/vehicle-register-dialog.component';
import { ParkingService } from '../services/parking.service';

const STATUS_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  OCUPADO: 'Ocupado',
  RESERVADO: 'Reservado',
  EN_MANTENIMIENTO: 'En mantenimiento',
};

@Component({
  selector: 'app-parking-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './parking-list.component.html',
  styleUrl: './parking-list.component.scss',
})
export class ParkingListComponent {
  private readonly parkingService = inject(ParkingService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly showStaffTabs = computed(() => {
    const role = this.auth.getCurrentUser()?.role;
    return role === 'ADMIN' || role === 'SECURITY';
  });

  readonly canRegisterVehicle = computed(() => this.auth.getCurrentUser()?.role === 'RESIDENT');

  readonly vehicles = signal<VehicleInfo[]>([]);
  readonly vehiclesLoading = signal(false);
  readonly vehiclesError = signal<string | null>(null);
  readonly vehicleColumns = ['plate', 'brand', 'model', 'color', 'unitNumber', 'ownerName'];

  readonly spots = signal<ParkingSpot[]>([]);
  readonly spotsLoading = signal(false);
  readonly spotsError = signal<string | null>(null);
  readonly spotColumns = ['spotNumber', 'status', 'unitNumber', 'floor', 'visitor'];

  readonly logEntries = signal<ParkingLogEntry[]>([]);
  readonly logLoading = signal(false);
  readonly logError = signal<string | null>(null);
  readonly logTotal = signal(0);
  readonly logPageIndex = signal(0);
  readonly logPageSize = signal(20);
  readonly logColumns = ['plate', 'spotNumber', 'entryTime', 'exitTime', 'notes', 'actions'];

  constructor() {
    this.loadVehicles();
    if (this.showStaffTabs()) {
      this.loadSpots();
      this.loadLog();
    }
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  spotStatusChipColor(status: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case 'DISPONIBLE':
        return 'primary';
      case 'OCUPADO':
        return 'warn';
      case 'RESERVADO':
        return 'accent';
      case 'EN_MANTENIMIENTO':
        return undefined;
      default:
        return undefined;
    }
  }

  openRegisterVehicle(): void {
    const ref = this.dialog.open(VehicleRegisterDialogComponent, {
      width: '440px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadVehicles();
    });
  }

  openLogEntry(): void {
    const ref = this.dialog.open(ParkingEntryDialogComponent, {
      width: '440px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.loadLog();
        this.loadSpots();
      }
    });
  }

  onLogPage(ev: PageEvent): void {
    this.logPageIndex.set(ev.pageIndex);
    this.logPageSize.set(ev.pageSize);
    this.loadLog();
  }

  registerExit(entry: ParkingLogEntry, event: Event): void {
    event.stopPropagation();
    this.parkingService.logExit(entry.id).subscribe({
      next: () => {
        this.loadLog();
        this.loadSpots();
      },
    });
  }

  isActiveEntry(entry: ParkingLogEntry): boolean {
    return !entry.exitTime;
  }

  private loadVehicles(): void {
    this.vehiclesLoading.set(true);
    this.vehiclesError.set(null);
    this.parkingService
      .listVehicles()
      .pipe(finalize(() => this.vehiclesLoading.set(false)))
      .subscribe({
        next: (list) => this.vehicles.set(list ?? []),
        error: () => {
          this.vehiclesError.set('No se pudieron cargar los vehículos.');
          this.vehicles.set([]);
        },
      });
  }

  private loadSpots(): void {
    this.spotsLoading.set(true);
    this.spotsError.set(null);
    this.parkingService
      .listSpots()
      .pipe(finalize(() => this.spotsLoading.set(false)))
      .subscribe({
        next: (list) => this.spots.set(list ?? []),
        error: () => {
          this.spotsError.set('No se pudieron cargar los parqueaderos.');
          this.spots.set([]);
        },
      });
  }

  private loadLog(): void {
    this.logLoading.set(true);
    this.logError.set(null);
    this.parkingService
      .listLog(this.logPageIndex(), this.logPageSize())
      .pipe(finalize(() => this.logLoading.set(false)))
      .subscribe({
        next: (page) => {
          this.logEntries.set(page.content ?? []);
          this.logTotal.set(page.totalElements ?? 0);
        },
        error: () => {
          this.logError.set('No se pudo cargar el registro de ingresos.');
          this.logEntries.set([]);
          this.logTotal.set(0);
        },
      });
  }
}
