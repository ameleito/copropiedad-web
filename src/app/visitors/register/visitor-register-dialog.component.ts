import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { AuthService } from '../../auth/services/auth.service';
import { VisitorService } from '../services/visitor.service';

const SEED_BUILDING_ID = 'a0000000-0000-0000-0000-000000000001';

interface TowerOption { id: string; name: string; totalFloors: number; }
interface UnitOption { id: string; number: string; floor: number | null; towerName: string | null; }
interface TorreGroup { name: string; towers: TowerOption[]; }

@Component({
  selector: 'app-visitor-register-dialog',
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
    MatSlideToggleModule,
    MatDatepickerModule,
  ],
  templateUrl: './visitor-register-dialog.component.html',
  styleUrl: './visitor-register-dialog.component.scss',
})
export class VisitorRegisterDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly dialogRef = inject(MatDialogRef<VisitorRegisterDialogComponent>);
  private readonly visitorService = inject(VisitorService);
  private readonly auth = inject(AuthService);

  readonly isResident = this.auth.user()?.role === 'RESIDENT';
  readonly isSecurity = this.auth.user()?.role === 'SECURITY' || this.auth.user()?.role === 'ADMIN';

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    idDocument: [''],
    expectedDate: [null as Date | null],
    expectedTime: [''],
    notes: [''],
    unitId: [''],
    walkIn: [false],
  });

  readonly today = new Date();

  readonly timeSlots: string[] = Array.from({ length: 30 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6;
    const min = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  });

  readonly towers = signal<TowerOption[]>([]);
  readonly allUnits = signal<UnitOption[]>([]);
  readonly selectedTorre = signal('');
  readonly selectedTowerId = signal('');
  readonly torreGroups = signal<TorreGroup[]>([]);
  readonly interiorsForTorre = signal<TowerOption[]>([]);
  readonly filteredUnits = signal<UnitOption[]>([]);

  submitting = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    if (!this.isResident) {
      this.loadTowers();
      this.loadUnits();
    }
  }

  onTorreChange(torre: string): void {
    this.selectedTorre.set(torre);
    this.selectedTowerId.set('');
    this.form.controls.unitId.reset();
    const group = this.torreGroups().find(g => g.name === torre);
    this.interiorsForTorre.set(group?.towers ?? []);
    this.filteredUnits.set([]);
  }

  onInteriorChange(towerId: string): void {
    this.selectedTowerId.set(towerId);
    this.form.controls.unitId.reset();
    const tower = this.towers().find(t => t.id === towerId);
    this.filteredUnits.set(
      this.allUnits()
        .filter(u => tower && u.towerName === tower.name)
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
    const val = this.form.getRawValue();

    if (this.isSecurity && val.walkIn) {
      this.visitorService
        .walkIn({
          unitId: val.unitId,
          fullName: val.fullName,
          idDocument: val.idDocument || undefined,
          notes: val.notes || undefined,
        })
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => {
            this.errorMessage = err?.error?.message ?? 'No se pudo registrar.';
          },
        });
    } else {
      let expectedAtIso: string | undefined;
      if (val.expectedDate) {
        const d = new Date(val.expectedDate);
        if (val.expectedTime) {
          const [h, m] = val.expectedTime.split(':').map(Number);
          d.setHours(h, m, 0, 0);
        }
        expectedAtIso = d.toISOString();
      }

      this.visitorService
        .preregister({
          unitId: val.unitId || undefined,
          fullName: val.fullName,
          idDocument: val.idDocument || undefined,
          expectedAt: expectedAtIso,
          notes: val.notes || undefined,
        })
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => {
            this.errorMessage = err?.error?.message ?? 'No se pudo registrar.';
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
              .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
              .map(([name, towers]) => ({ name, towers })),
          );
        },
      });
  }

  private loadUnits(): void {
    this.http
      .get<ApiResponse<UnitOption[]>>(
        `${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/units`,
      )
      .subscribe({
        next: (res) => this.allUnits.set(res.data ?? []),
      });
  }
}
