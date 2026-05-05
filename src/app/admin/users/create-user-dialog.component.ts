import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, UserRole } from '../../core/models/auth.model';
import { UserProfile } from '../../core/models/user.model';
import {
  BuildingService,
  PublicInterior,
  PublicTower,
  PublicUnit,
} from '../../core/services/building.service';

export interface EditUserData {
  user: UserProfile;
}

@Component({
  selector: 'app-create-user-dialog',
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
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.scss',
})
export class CreateUserDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly buildingService = inject(BuildingService);
  private readonly dialogRef = inject(MatDialogRef<CreateUserDialogComponent>);
  private readonly editData = inject<EditUserData | null>(MAT_DIALOG_DATA, { optional: true });

  readonly isEditMode = !!this.editData?.user;

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
    phone: [''],
    idDocument: [''],
    role: ['RESIDENT' as string, [Validators.required]],
    unitId: [''],
  });

  readonly roles: { value: UserRole; label: string }[] = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'FINANCE', label: 'Finanzas' },
    { value: 'SECURITY', label: 'Seguridad' },
    { value: 'MAINTENANCE', label: 'Mantenimiento' },
    { value: 'RESIDENT', label: 'Residente' },
  ];

  readonly towers = signal<PublicTower[]>([]);
  readonly interiors = signal<PublicInterior[]>([]);
  readonly units = signal<PublicUnit[]>([]);
  readonly selectedTowerId = signal<string>('');
  readonly selectedInteriorId = signal<string>('');

  submitting = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.buildingService.towers().subscribe({ next: (t) => this.towers.set(t) });

    if (this.isEditMode && this.editData?.user) {
      const u = this.editData.user;
      this.form.patchValue({
        fullName: u.fullName ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        idDocument: u.idDocument ?? '',
        role: u.role ?? 'RESIDENT',
        unitId: u.unitId ?? '',
      });
      this.form.controls.email.disable();
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
          this.loadUnits(towerId, null);
        }
      },
    });
  }

  onInteriorChange(interiorId: string): void {
    this.selectedInteriorId.set(interiorId);
    this.form.controls.unitId.reset();
    this.loadUnits(null, interiorId);
  }

  submit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const { fullName, email, password, phone, idDocument, role, unitId } =
      this.form.getRawValue();

    if (this.isEditMode) {
      const userId = this.editData!.user.id;
      const body: Record<string, unknown> = { fullName, phone, idDocument, role };
      if (unitId) body['unitId'] = unitId;
      this.http
        .put<ApiResponse<UserProfile>>(
          `${environment.apiUrl}/api/users/${userId}`,
          body,
        )
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => {
            this.errorMessage =
              err?.error?.message ?? 'No se pudo actualizar el usuario.';
          },
        });
    } else {
      const body: Record<string, unknown> = {
        fullName, email, password, phone, idDocument, role,
      };
      if (unitId) body['unitId'] = unitId;
      this.http
        .post<ApiResponse<UserProfile>>(
          `${environment.apiUrl}/api/users`,
          body,
        )
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => {
            this.errorMessage =
              err?.error?.message ?? 'No se pudo crear el usuario.';
          },
        });
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private loadUnits(towerId: string | null, interiorId: string | null): void {
    this.buildingService.units(towerId, interiorId).subscribe({
      next: (u) => this.units.set(u),
      error: () => {},
    });
  }
}
