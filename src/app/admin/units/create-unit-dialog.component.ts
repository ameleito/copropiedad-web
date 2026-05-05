import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { InteriorResponse } from '../../core/models/interior.model';
import { TowerResponse } from '../../core/models/tower.model';
import { UnitResponse } from '../../core/models/unit.model';
import { InteriorService } from '../interiors/interior.service';
import { TowerService } from '../towers/tower.service';
import { UnitService } from './unit.service';

export interface UnitDialogData {
  unit?: UnitResponse;
}

@Component({
  selector: 'app-create-unit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Editar unidad' : 'Agregar unidad residencial' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Número de apartamento *</mat-label>
          <input matInput formControlName="number" placeholder="Ej: 101, A-302" maxlength="20" />
          @if (form.get('number')?.hasError('required') && form.get('number')?.touched) {
            <mat-error>El número de apartamento es obligatorio.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Torre (opcional)</mat-label>
          <mat-select formControlName="towerId">
            <mat-option [value]="null">Sin torre</mat-option>
            @for (tower of towers(); track tower.id) {
              <mat-option [value]="tower.id">{{ tower.name }}</mat-option>
            }
          </mat-select>
          @if (loadingTowers()) {
            <mat-hint>Cargando torres…</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Interior (opcional)</mat-label>
          <mat-select formControlName="interiorId">
            <mat-option [value]="null">Sin interior</mat-option>
            @for (interior of filteredInteriors(); track interior.id) {
              <mat-option [value]="interior.id">
                {{ interior.name }}{{ interior.towerName ? ' — ' + interior.towerName : '' }}
              </mat-option>
            }
          </mat-select>
          @if (loadingInteriors()) {
            <mat-hint>Cargando interiores…</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Piso (opcional)</mat-label>
          <input matInput type="number" formControlName="floor" min="0" max="200" placeholder="Ej: 3" />
        </mat-form-field>

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close [disabled]="saving()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
        @if (saving()) {
          <mat-progress-spinner diameter="18" mode="indeterminate" />
        } @else {
          {{ isEditMode ? 'Actualizar' : 'Guardar' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; min-width: 420px; }
    .full-width { width: 100%; }
    .error-msg { color: var(--mdc-theme-error, #f44336); font-size: 0.85rem; margin: 0; }
  `],
})
export class CreateUnitDialogComponent implements OnInit {
  private readonly unitService = inject(UnitService);
  private readonly towerService = inject(TowerService);
  private readonly interiorService = inject(InteriorService);
  private readonly dialogRef = inject(MatDialogRef<CreateUnitDialogComponent>);
  private readonly data = inject<UnitDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);

  readonly isEditMode = !!this.data?.unit;
  readonly towers = signal<TowerResponse[]>([]);
  readonly allInteriors = signal<InteriorResponse[]>([]);
  readonly filteredInteriors = signal<InteriorResponse[]>([]);
  readonly loadingTowers = signal(false);
  readonly loadingInteriors = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    number: [this.data?.unit?.number ?? '', [Validators.required, Validators.maxLength(20)]],
    towerId: [this.data?.unit?.towerId ?? null as string | null],
    interiorId: [this.data?.unit?.interiorId ?? null as string | null],
    floor: [this.data?.unit?.floor ?? null as number | null],
  });

  ngOnInit(): void {
    this.loadingTowers.set(true);
    this.towerService.list()
      .pipe(finalize(() => this.loadingTowers.set(false)))
      .subscribe({ next: (t) => this.towers.set(t), error: () => {} });

    this.loadingInteriors.set(true);
    this.interiorService.list()
      .pipe(finalize(() => this.loadingInteriors.set(false)))
      .subscribe({
        next: (interiors) => {
          this.allInteriors.set(interiors);
          this.updateFilteredInteriors(this.form.get('towerId')?.value);
        },
        error: () => {},
      });

    this.form.get('towerId')?.valueChanges.subscribe((towerId) => {
      this.updateFilteredInteriors(towerId);

      const currentInteriorId = this.form.get('interiorId')?.value;
      if (currentInteriorId) {
        const interior = this.allInteriors().find(i => i.id === currentInteriorId);
        if (interior && towerId && interior.towerId !== towerId) {
          this.form.get('interiorId')?.setValue(null);
        }
      }
    });
  }

  save(): void {
    this.error.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { number, towerId, interiorId, floor } = this.form.getRawValue();
    this.saving.set(true);

    const request = {
      number,
      towerId: towerId || null,
      interiorId: interiorId || null,
      floor: floor != null ? Number(floor) : null,
    };
    const action$ = this.isEditMode
      ? this.unitService.update(this.data!.unit!.id, request)
      : this.unitService.create(request);

    action$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg = err?.error?.message ?? (this.isEditMode ? 'No se pudo actualizar la unidad.' : 'No se pudo crear la unidad.');
          this.error.set(typeof msg === 'string' ? msg : 'Error al guardar.');
        },
      });
  }

  private updateFilteredInteriors(towerId: string | null | undefined): void {
    if (towerId) {
      this.filteredInteriors.set(this.allInteriors().filter(i => i.towerId === towerId));
    } else {
      this.filteredInteriors.set(this.allInteriors());
    }
  }
}
