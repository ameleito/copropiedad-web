import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { TowerResponse } from '../../core/models/tower.model';
import { TowerService } from './tower.service';

/* ── Inline create/edit dialog ── */
interface TowerDialogData { tower?: TowerResponse }

@Component({
  selector: 'app-tower-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.tower ? 'Editar torre' : 'Nueva torre' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="df">
        <mat-form-field appearance="outline" class="fw">
          <mat-label>Nombre *</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Torre 1" maxlength="40" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es obligatorio.</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="fw">
          <mat-label>Número de pisos</mat-label>
          <input matInput type="number" formControlName="totalFloors" min="1" placeholder="Ej: 17" />
        </mat-form-field>
        @if (error()) { <p class="err">{{ error() }}</p> }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close [disabled]="saving()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
        @if (saving()) { <mat-progress-spinner diameter="18" mode="indeterminate" /> }
        @else { {{ data?.tower ? 'Actualizar' : 'Guardar' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.df{display:flex;flex-direction:column;gap:4px;padding-top:8px;min-width:360px}.fw{width:100%}.err{color:#f44336;font-size:.85rem;margin:0}`],
})
export class TowerDialogComponent {
  readonly data = inject<TowerDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly towerService = inject(TowerService);
  private readonly dialogRef = inject(MatDialogRef<TowerDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: [this.data?.tower?.name ?? '', [Validators.required, Validators.maxLength(40)]],
    totalFloors: [this.data?.tower?.totalFloors ?? 1],
  });

  save(): void {
    this.error.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { name, totalFloors } = this.form.getRawValue();
    this.saving.set(true);
    const request = { name, totalFloors: Number(totalFloors) || 1 };
    const action$ = this.data?.tower
      ? this.towerService.update(this.data.tower.id, request)
      : this.towerService.create(request);
    action$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo guardar la torre.';
        this.error.set(typeof msg === 'string' ? msg : 'Error al guardar.');
      },
    });
  }
}

/* ── Main component ── */
@Component({
  selector: 'app-admin-towers',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './admin-towers.component.html',
  styleUrl: './admin-towers.component.scss',
})
export class AdminTowersComponent implements OnInit {
  private readonly towerService = inject(TowerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly towers = signal<TowerResponse[]>([]);
  readonly loading = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly displayedColumns = ['name', 'totalFloors', 'actions'];

  ngOnInit(): void { this.load(); }

  openCreate(): void {
    this.dialog.open(TowerDialogComponent, { width: '440px', disableClose: true })
      .afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  openEdit(tower: TowerResponse): void {
    this.dialog.open(TowerDialogComponent, { width: '440px', disableClose: true, data: { tower } })
      .afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  delete(tower: TowerResponse): void {
    if (!confirm(`¿Eliminar la torre "${tower.name}"? Se desvincularán sus interiores y unidades.`)) return;
    this.deletingId.set(tower.id);
    this.towerService.delete(tower.id).subscribe({
      next: () => {
        this.snackBar.open('Torre eliminada.', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo eliminar la torre.';
        this.snackBar.open(typeof msg === 'string' ? msg : 'Error al eliminar.', 'Cerrar', { duration: 4000 });
        this.deletingId.set(null);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.deletingId.set(null);
    this.towerService.list().subscribe({
      next: (t) => { this.towers.set(t); this.loading.set(false); },
      error: () => { this.towers.set([]); this.loading.set(false); },
    });
  }
}
