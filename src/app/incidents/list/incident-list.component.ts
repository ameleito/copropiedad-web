import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { finalize } from 'rxjs/operators';
import { Incident } from '../../core/models/incident.model';
import { IncidentService } from '../services/incident.service';
import { IncidentCreateDialogComponent } from '../create/incident-create-dialog.component';
import { IncidentDetailDialogComponent } from '../detail/incident-detail-dialog.component';

@Component({
  selector: 'app-incident-list',
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
    MatTabsModule,
  ],
  templateUrl: './incident-list.component.html',
  styleUrl: './incident-list.component.scss',
})
export class IncidentListComponent {
  private readonly incidentService = inject(IncidentService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly items = signal<Incident[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  /** undefined = todos; 'open' = abiertos */
  readonly listFilter = signal<string | undefined>(undefined);
  readonly loadError = signal<string | null>(null);

  readonly displayedColumns = ['title', 'location', 'severity', 'reportedBy', 'createdAt', 'status'] as const;

  constructor() {
    this.loadIncidents();
  }

  onTabChange(index: number): void {
    this.listFilter.set(index === 0 ? undefined : 'open');
    this.pageIndex.set(0);
    this.loadIncidents();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadIncidents();
  }

  severityChipColor(severity: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (severity) {
      case 'MEDIA':
        return 'primary';
      case 'ALTA':
        return 'accent';
      case 'CRITICA':
        return 'warn';
      default:
        return undefined;
    }
  }

  severityLabel(severity: string): string {
    const map: Record<string, string> = {
      BAJA: 'Baja',
      MEDIA: 'Media',
      ALTA: 'Alta',
      CRITICA: 'Crítica',
    };
    return map[severity] ?? severity;
  }

  openCreate(): void {
    const ref = this.dialog.open(IncidentCreateDialogComponent, {
      width: '560px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadIncidents();
    });
  }

  openDetail(row: Incident): void {
    const ref = this.dialog.open(IncidentDetailDialogComponent, {
      width: '600px',
      data: row,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadIncidents();
    });
  }

  private loadIncidents(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.incidentService
      .list(this.listFilter(), this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar los incidentes. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
