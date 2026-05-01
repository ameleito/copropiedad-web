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

const SEED_BUILDING_ID = 'a0000000-0000-0000-0000-000000000001';

interface TowerOption { id: string; name: string; totalFloors: number; }
interface UnitOption { id: string; number: string; floor: number | null; type: string; towerName: string | null; }
interface TorreGroup { name: string; towers: TowerOption[]; }

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

  readonly towers = signal<TowerOption[]>([]);
  readonly allUnits = signal<UnitOption[]>([]);
  readonly selectedTorre = signal<string>('');
  readonly selectedTowerId = signal<string>('');
  readonly torreGroups = signal<TorreGroup[]>([]);
  readonly interiorsForTorre = signal<TowerOption[]>([]);
  readonly filteredUnits = signal<UnitOption[]>([]);

  submitting = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadTowers();
    this.loadUnits();
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

  onTorreChange(torre: string): void {
    this.selectedTorre.set(torre);
    this.selectedTowerId.set('');
    this.form.controls.unitId.reset();
    const group = this.torreGroups().find((g) => g.name === torre);
    this.interiorsForTorre.set(group?.towers ?? []);
    this.filteredUnits.set([]);
  }

  onInteriorChange(towerId: string): void {
    this.selectedTowerId.set(towerId);
    this.form.controls.unitId.reset();
    const tower = this.towers().find((t) => t.id === towerId);
    this.filteredUnits.set(
      this.allUnits()
        .filter((u) => tower && u.towerName === tower.name)
        .sort((a, b) => {
          const fd = (a.floor ?? 0) - (b.floor ?? 0);
          return fd !== 0 ? fd : parseInt(a.number) - parseInt(b.number);
        }),
    );
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

  private loadTowers(): void {
    this.http
      .get<ApiResponse<TowerOption[]>>(
        `${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/towers`,
      )
      .subscribe({
        next: (res) => {
          const data = res.data ?? [];
          this.towers.set(data);
          const groups = new Map<string, TowerOption[]>();
          for (const t of data) {
            const match = t.name.match(/^(Torre \d+)/);
            const key = match ? match[1] : t.name;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(t);
          }
          this.torreGroups.set(
            Array.from(groups.entries())
              .sort(([a], [b]) =>
                a.localeCompare(b, undefined, { numeric: true }),
              )
              .map(([name, towers]) => ({ name, towers })),
          );
        },
        error: () => {},
      });
  }

  private loadUnits(): void {
    this.http
      .get<ApiResponse<UnitOption[]>>(
        `${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/units`,
      )
      .subscribe({
        next: (res) => this.allUnits.set(res.data ?? []),
        error: () => {},
      });
  }
}
