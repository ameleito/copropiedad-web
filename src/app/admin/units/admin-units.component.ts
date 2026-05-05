import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime } from 'rxjs/operators';
import { UnitResponse } from '../../core/models/unit.model';
import { CreateUnitDialogComponent, UnitDialogData } from './create-unit-dialog.component';
import { UnitService } from './unit.service';

@Component({
  selector: 'app-admin-units',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-units.component.html',
  styleUrl: './admin-units.component.scss',
})
export class AdminUnitsComponent implements OnInit {
  private readonly unitService = inject(UnitService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly allUnits = signal<UnitResponse[]>([]);
  readonly filteredUnits = signal<UnitResponse[]>([]);
  readonly loading = signal(false);
  readonly deletingId = signal<string | null>(null);

  readonly displayedColumns = ['number', 'tower', 'interior', 'floor', 'actions'];

  readonly filterForm = this.fb.group({ search: [''], tower: ['ALL'] });

  readonly towerOptions = signal<{ id: string; name: string }[]>([]);

  ngOnInit(): void {
    this.loadUnits();
    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.applyFilter());
  }

  openCreateDialog(): void {
    this.dialog
      .open(CreateUnitDialogComponent, { width: '520px', disableClose: true })
      .afterClosed()
      .subscribe((created) => { if (created) this.loadUnits(); });
  }

  openEditDialog(unit: UnitResponse): void {
    const data: UnitDialogData = { unit };
    this.dialog
      .open(CreateUnitDialogComponent, { width: '520px', disableClose: true, data })
      .afterClosed()
      .subscribe((updated) => { if (updated) this.loadUnits(); });
  }

  deleteUnit(unit: UnitResponse): void {
    if (!confirm(`¿Eliminar la unidad ${unit.number}? Esta acción no se puede deshacer.`)) return;

    this.deletingId.set(unit.id);
    this.unitService.delete(unit.id).subscribe({
      next: () => {
        this.snackBar.open('Unidad eliminada correctamente.', 'Cerrar', { duration: 3000 });
        this.loadUnits();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo eliminar la unidad.';
        this.snackBar.open(typeof msg === 'string' ? msg : 'Error al eliminar.', 'Cerrar', { duration: 4000 });
        this.deletingId.set(null);
      },
    });
  }

  private loadUnits(): void {
    this.loading.set(true);
    this.deletingId.set(null);
    this.unitService.listUnits().subscribe({
      next: (units) => {
        this.allUnits.set(units);
        const towers = [...new Map(
          units.filter(u => u.towerId).map(u => [u.towerId, { id: u.towerId!, name: u.towerName! }])
        ).values()];
        this.towerOptions.set(towers);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.allUnits.set([]);
        this.filteredUnits.set([]);
        this.loading.set(false);
      },
    });
  }

  private applyFilter(): void {
    const { search, tower } = this.filterForm.value;
    const term = (search ?? '').toLowerCase().trim();
    this.filteredUnits.set(
      this.allUnits().filter((u) => {
        const matchesSearch = !term
          || u.number.toLowerCase().includes(term)
          || (u.towerName ?? '').toLowerCase().includes(term)
          || (u.interiorName ?? '').toLowerCase().includes(term);
        const matchesTower = !tower || tower === 'ALL'
          || u.towerId === tower
          || (tower === 'NONE' && !u.towerId);
        return matchesSearch && matchesTower;
      }),
    );
  }
}
