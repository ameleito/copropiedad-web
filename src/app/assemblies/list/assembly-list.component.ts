import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { AssemblyItem } from '../../core/models/assembly.model';
import { AssemblyCreateDialogComponent } from '../create/assembly-create-dialog.component';
import { AssemblyDetailDialogComponent } from '../detail/assembly-detail-dialog.component';
import { AssemblyService } from '../services/assembly.service';

@Component({
  selector: 'app-assembly-list',
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
  ],
  templateUrl: './assembly-list.component.html',
  styleUrl: './assembly-list.component.scss',
})
export class AssemblyListComponent {
  private readonly assemblyService = inject(AssemblyService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly items = signal<AssemblyItem[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly loadError = signal<string | null>(null);

  readonly isAdmin = computed(() => this.auth.getCurrentUser()?.role === 'ADMIN');

  constructor() {
    this.loadList();
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      ORDINARIA: 'Ordinaria',
      EXTRAORDINARIA: 'Extraordinaria',
    };
    return map[type] ?? type;
  }

  statusChipColor(status: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case 'CONVOCADA':
        return 'primary';
      case 'EN_CURSO':
        return 'accent';
      case 'FINALIZADA':
        return undefined;
      case 'CANCELADA':
        return 'warn';
      default:
        return undefined;
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      CONVOCADA: 'Convocada',
      EN_CURSO: 'En curso',
      FINALIZADA: 'Finalizada',
      CANCELADA: 'Cancelada',
    };
    return map[status] ?? status;
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadList();
  }

  openCreate(): void {
    const ref = this.dialog.open(AssemblyCreateDialogComponent, {
      width: '560px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadList();
    });
  }

  openDetail(row: AssemblyItem): void {
    const ref = this.dialog.open(AssemblyDetailDialogComponent, {
      width: '700px',
      data: row,
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadList();
    });
  }

  private loadList(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.assemblyService
      .listAssemblies(this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar las asambleas. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
