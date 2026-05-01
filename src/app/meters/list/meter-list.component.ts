import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { MeterItem, MeterReadingItem } from '../../core/models/meter.model';
import { MeterCreateDialogComponent } from '../create/meter-create-dialog.component';
import { MeterReadingDialogComponent } from '../reading/meter-reading-dialog.component';
import { MeterService } from '../services/meter.service';

const METER_TYPE_LABELS: Record<string, string> = {
  AGUA: 'Agua',
  GAS: 'Gas',
  ELECTRICIDAD: 'Electricidad',
};

@Component({
  selector: 'app-meter-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './meter-list.component.html',
  styleUrl: './meter-list.component.scss',
})
export class MeterListComponent {
  private readonly meterService = inject(MeterService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  /** Role checks from AuthService (computed signals). */
  readonly isAdmin = this.auth.isAdmin;
  readonly isFinance = this.auth.isFinance;

  readonly meters = signal<MeterItem[]>([]);
  readonly selectedMeter = signal<MeterItem | null>(null);
  readonly readings = signal<MeterReadingItem[]>([]);
  readonly metersLoading = signal(false);
  readonly readingsLoading = signal(false);
  readonly loading = computed(() => this.metersLoading() || this.readingsLoading());

  readonly metersError = signal<string | null>(null);
  readonly readingsError = signal<string | null>(null);

  readonly expandedMeterId = signal<string | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalReadings = signal(0);

  readonly meterColumns = ['unitNumber', 'type', 'meterNumber', 'actions'];
  readonly readingColumns = ['period', 'readingValue', 'consumption', 'readByName', 'readAt'];

  readonly canRegisterReading = computed(() => this.isAdmin() || this.isFinance());

  constructor() {
    this.loadMeters();
  }

  typeLabel(type: string): string {
    return METER_TYPE_LABELS[type] ?? type;
  }

  isRowExpanded(meterId: string): boolean {
    return this.expandedMeterId() === meterId;
  }

  toggleReadings(meter: MeterItem): void {
    if (this.expandedMeterId() === meter.id) {
      this.expandedMeterId.set(null);
      this.selectedMeter.set(null);
      this.readings.set([]);
      this.readingsError.set(null);
      return;
    }
    this.expandedMeterId.set(meter.id);
    this.selectedMeter.set(meter);
    this.pageIndex.set(0);
    this.loadReadings();
  }

  onReadingsPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadReadings();
  }

  openCreateMeter(): void {
    const ref = this.dialog.open(MeterCreateDialogComponent, { width: '440px', disableClose: true });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadMeters();
    });
  }

  openRegisterReading(): void {
    const meter = this.selectedMeter();
    if (!meter) return;
    const ref = this.dialog.open(MeterReadingDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { meterId: meter.id },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadReadings();
    });
  }

  private loadMeters(): void {
    this.metersLoading.set(true);
    this.metersError.set(null);
    this.meterService
      .listMeters()
      .pipe(finalize(() => this.metersLoading.set(false)))
      .subscribe({
        next: (list) => {
          this.meters.set(list ?? []);
          const sel = this.selectedMeter();
          if (sel && !list.some((m) => m.id === sel.id)) {
            this.selectedMeter.set(null);
            this.expandedMeterId.set(null);
            this.readings.set([]);
          }
        },
        error: () => {
          this.metersError.set('No se pudieron cargar los medidores.');
          this.meters.set([]);
        },
      });
  }

  private loadReadings(): void {
    const meter = this.selectedMeter();
    if (!meter) return;
    this.readingsLoading.set(true);
    this.readingsError.set(null);
    this.meterService
      .listReadings(meter.id, this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.readingsLoading.set(false)))
      .subscribe({
        next: (page) => {
          this.readings.set(page.content ?? []);
          this.totalReadings.set(page.totalElements ?? 0);
        },
        error: () => {
          this.readingsError.set('No se pudieron cargar las lecturas.');
          this.readings.set([]);
          this.totalReadings.set(0);
        },
      });
  }
}
