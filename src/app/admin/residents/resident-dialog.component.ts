import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import {
  BuildingService,
  PublicInterior,
  PublicTower,
  PublicUnit,
} from '../../core/services/building.service';
import { CreateResidentRequest, ResidentService } from './resident.service';

export interface ResidentDialogData {
  /** When provided the unit is fixed (resident adding to their own unit) */
  fixedUnit?: { id: string; number: string; towerName?: string | null; interiorName?: string | null };
  /** Admin mode: show tower/interior/unit selectors */
  adminMode: boolean;
}

@Component({
  selector: 'app-resident-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
<h2 mat-dialog-title>
  <mat-icon class="dialog-icon">person_add</mat-icon>
  {{ data?.fixedUnit ? 'Agregar residente a mi unidad' : 'Nuevo residente' }}
</h2>

<mat-dialog-content>
  @if (errorMessage) {
    <div class="error-banner" role="alert">
      <mat-icon>error_outline</mat-icon>
      <span>{{ errorMessage }}</span>
    </div>
  }

  <form [formGroup]="form" class="dialog-form">

    @if (data?.fixedUnit) {
      <div class="unit-info-banner">
        <mat-icon>apartment</mat-icon>
        <span>Apto {{ data!.fixedUnit!.number }}
          @if (data!.fixedUnit!.towerName) { · {{ data!.fixedUnit!.towerName }} }
          @if (data!.fixedUnit!.interiorName) { · {{ data!.fixedUnit!.interiorName }} }
        </span>
      </div>
    }

    @if (data?.adminMode && !data?.fixedUnit) {
      <h4 class="section-label">Ubicación</h4>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Torre</mat-label>
        <mat-icon matPrefix>location_city</mat-icon>
        <mat-select (selectionChange)="onTowerChange($event.value)">
          @for (t of towers(); track t.id) {
            <mat-option [value]="t.id">{{ t.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (selectedTowerId() && interiors().length > 0) {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Interior</mat-label>
          <mat-icon matPrefix>meeting_room</mat-icon>
          <mat-select (selectionChange)="onInteriorChange($event.value)">
            @for (i of interiors(); track i.id) {
              <mat-option [value]="i.id">{{ i.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      @if (units().length > 0) {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Apartamento</mat-label>
          <mat-icon matPrefix>apartment</mat-icon>
          <mat-select formControlName="unitId">
            @for (u of units(); track u.id) {
              <mat-option [value]="u.id">
                Apto {{ u.number }}{{ u.floor != null ? ' · Piso ' + u.floor : '' }}
              </mat-option>
            }
          </mat-select>
          @if (form.get('unitId')?.hasError('required') && form.get('unitId')?.touched) {
            <mat-error>Selecciona el apartamento.</mat-error>
          }
        </mat-form-field>
      }
    }

    <h4 class="section-label">Datos personales</h4>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Nombre completo</mat-label>
      <mat-icon matPrefix>badge</mat-icon>
      <input matInput formControlName="fullName" />
      @if (form.get('fullName')?.hasError('required') && form.get('fullName')?.touched) {
        <mat-error>El nombre es requerido.</mat-error>
      }
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Correo electrónico</mat-label>
      <mat-icon matPrefix>email</mat-icon>
      <input matInput type="email" formControlName="email" />
      @if (form.get('email')?.invalid && form.get('email')?.touched) {
        <mat-error>Correo inválido.</mat-error>
      }
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Contraseña temporal</mat-label>
      <mat-icon matPrefix>lock</mat-icon>
      <input matInput type="password" formControlName="password" />
      @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
        <mat-error>Mínimo 8 caracteres.</mat-error>
      }
    </mat-form-field>

    <div class="row-2col">
      <mat-form-field appearance="outline">
        <mat-label>Teléfono</mat-label>
        <mat-icon matPrefix>phone</mat-icon>
        <input matInput formControlName="phone" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Documento</mat-label>
        <mat-icon matPrefix>assignment_ind</mat-icon>
        <input matInput formControlName="idDocument" />
      </mat-form-field>
    </div>
  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button type="button" (click)="cancel()">Cancelar</button>
  <button mat-flat-button color="primary" type="button" [disabled]="submitting" (click)="save()">
    @if (submitting) {
      <mat-progress-spinner diameter="18" mode="indeterminate" />
    } @else {
      Guardar
    }
  </button>
</mat-dialog-actions>
  `,
  styles: [`
    .dialog-icon { vertical-align: middle; margin-right: 8px; }
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 460px; padding-top: 8px; }
    .section-label { margin: 8px 0 4px; font-size: 13px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .full-width { width: 100%; }
    .row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .error-banner { display: flex; align-items: center; gap: 8px; background: #fdecea; color: #c62828; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; font-size: 14px; }
    .unit-info-banner { display: flex; align-items: center; gap: 8px; background: #e3f2fd; color: #1565c0; padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; font-size: 14px; font-weight: 500; }
  `],
})
export class ResidentDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly buildingService = inject(BuildingService);
  private readonly residentService = inject(ResidentService);
  private readonly dialogRef = inject(MatDialogRef<ResidentDialogComponent>);
  readonly data = inject<ResidentDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  readonly towers = signal<PublicTower[]>([]);
  readonly interiors = signal<PublicInterior[]>([]);
  readonly units = signal<PublicUnit[]>([]);
  readonly selectedTowerId = signal('');
  readonly selectedInteriorId = signal('');

  readonly form = this.fb.nonNullable.group({
    unitId: [''],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    idDocument: [''],
  });

  submitting = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    if (this.data?.adminMode && !this.data?.fixedUnit) {
      this.form.get('unitId')!.setValidators(Validators.required);
      this.buildingService.towers().subscribe({ next: t => this.towers.set(t) });
    }
  }

  onTowerChange(towerId: string): void {
    this.selectedTowerId.set(towerId);
    this.selectedInteriorId.set('');
    this.units.set([]);
    this.form.controls.unitId.reset();
    this.buildingService.interiors(towerId).subscribe({
      next: (interiors) => {
        this.interiors.set(interiors);
        if (interiors.length === 0) {
          this.buildingService.units(towerId, null).subscribe({ next: u => this.units.set(u) });
        }
      },
    });
  }

  onInteriorChange(interiorId: string): void {
    this.selectedInteriorId.set(interiorId);
    this.form.controls.unitId.reset();
    this.buildingService.units(null, interiorId).subscribe({ next: u => this.units.set(u) });
  }

  save(): void {
    this.errorMessage = null;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;

    const v = this.form.getRawValue();
    const req: CreateResidentRequest = {
      fullName: v.fullName,
      email: v.email,
      password: v.password,
      phone: v.phone || undefined,
      idDocument: v.idDocument || undefined,
      unitId: this.data?.fixedUnit?.id ?? (v.unitId || undefined),
    };

    const call$ = this.data?.adminMode
      ? this.residentService.createAdmin(req)
      : this.residentService.addToMyUnit(req);

    call$.pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'No se pudo guardar el residente.';
      },
    });
  }

  cancel(): void { this.dialogRef.close(false); }
}
