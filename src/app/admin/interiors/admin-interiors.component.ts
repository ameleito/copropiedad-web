import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { InteriorResponse } from '../../core/models/interior.model';
import { TowerResponse } from '../../core/models/tower.model';
import { TowerService } from '../towers/tower.service';
import { InteriorService } from './interior.service';

/* ── Inline create/edit dialog ── */
interface InteriorDialogData { interior?: InteriorResponse; towers: TowerResponse[] }

@Component({
  selector: 'app-interior-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.interior ? 'Editar interior' : 'Nuevo interior' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="df">
        <mat-form-field appearance="outline" class="fw">
          <mat-label>Nombre *</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Interior 1" maxlength="40" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es obligatorio.</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="fw">
          <mat-label>Torre (opcional)</mat-label>
          <mat-select formControlName="towerId">
            <mat-option [value]="null">Sin torre</mat-option>
            @for (t of data?.towers ?? []; track t.id) {
              <mat-option [value]="t.id">{{ t.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (error()) { <p class="err">{{ error() }}</p> }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close [disabled]="saving()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
        @if (saving()) { <mat-progress-spinner diameter="18" mode="indeterminate" /> }
        @else { {{ data?.interior ? 'Actualizar' : 'Guardar' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.df{display:flex;flex-direction:column;gap:4px;padding-top:8px;min-width:380px}.fw{width:100%}.err{color:#f44336;font-size:.85rem;margin:0}`],
})
export class InteriorDialogComponent {
  readonly data = inject<InteriorDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly interiorService = inject(InteriorService);
  private readonly dialogRef = inject(MatDialogRef<InteriorDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: [this.data?.interior?.name ?? '', [Validators.required, Validators.maxLength(40)]],
    towerId: [this.data?.interior?.towerId ?? null as string | null],
  });

  save(): void {
    this.error.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { name, towerId } = this.form.getRawValue();
    this.saving.set(true);
    const request = { name, towerId: towerId || null };
    const action$ = this.data?.interior
      ? this.interiorService.update(this.data.interior.id, request)
      : this.interiorService.create(request);
    action$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo guardar el interior.';
        this.error.set(typeof msg === 'string' ? msg : 'Error al guardar.');
      },
    });
  }
}

/* ── Main component ── */
@Component({
  selector: 'app-admin-interiors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatDialogModule, MatTooltipModule, MatSnackBarModule,
    MatFormFieldModule, MatSelectModule, ReactiveFormsModule,
  ],
  templateUrl: './admin-interiors.component.html',
  styleUrl: './admin-interiors.component.scss',
})
export class AdminInteriorsComponent implements OnInit {
  private readonly interiorService = inject(InteriorService);
  private readonly towerService = inject(TowerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly allInteriors = signal<InteriorResponse[]>([]);
  readonly filteredInteriors = signal<InteriorResponse[]>([]);
  readonly towers = signal<TowerResponse[]>([]);
  readonly loading = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly displayedColumns = ['name', 'tower', 'actions'];

  readonly filterForm = this.fb.group({ tower: ['ALL'] });

  ngOnInit(): void {
    this.loadTowers();
    this.load();
    this.filterForm.valueChanges.subscribe(() => this.applyFilter());
  }

  openCreate(): void {
    this.dialog.open(InteriorDialogComponent, {
      width: '440px',
      disableClose: true,
      data: { towers: this.towers() },
    }).afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  openEdit(interior: InteriorResponse): void {
    this.dialog.open(InteriorDialogComponent, {
      width: '440px',
      disableClose: true,
      data: { interior, towers: this.towers() },
    }).afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  delete(interior: InteriorResponse): void {
    if (!confirm(`¿Eliminar el interior "${interior.name}"? Las unidades asociadas quedarán sin interior.`)) return;
    this.deletingId.set(interior.id);
    this.interiorService.delete(interior.id).subscribe({
      next: () => {
        this.snackBar.open('Interior eliminado.', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo eliminar el interior.';
        this.snackBar.open(typeof msg === 'string' ? msg : 'Error al eliminar.', 'Cerrar', { duration: 4000 });
        this.deletingId.set(null);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.deletingId.set(null);
    this.interiorService.list().subscribe({
      next: (interiors) => {
        this.allInteriors.set(interiors);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => { this.allInteriors.set([]); this.filteredInteriors.set([]); this.loading.set(false); },
    });
  }

  private loadTowers(): void {
    this.towerService.list().subscribe({ next: (t) => this.towers.set(t), error: () => {} });
  }

  private applyFilter(): void {
    const { tower } = this.filterForm.value;
    this.filteredInteriors.set(
      tower === 'ALL' ? this.allInteriors()
        : tower === 'NONE' ? this.allInteriors().filter(i => !i.towerId)
        : this.allInteriors().filter(i => i.towerId === tower)
    );
  }
}
