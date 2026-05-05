import { CommonModule } from '@angular/common';
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
import { AuthService } from '../../auth/services/auth.service';
import {
  BuildingService,
  PublicInterior,
  PublicTower,
  PublicUnit,
} from '../../core/services/building.service';
import { VisitorService } from '../services/visitor.service';

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
  private readonly buildingService = inject(BuildingService);
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

  readonly towers = signal<PublicTower[]>([]);
  readonly interiors = signal<PublicInterior[]>([]);
  readonly units = signal<PublicUnit[]>([]);
  readonly selectedTowerId = signal<string>('');
  readonly selectedInteriorId = signal<string>('');

  submitting = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    if (!this.isResident) {
      this.buildingService.towers().subscribe({ next: (t) => this.towers.set(t) });
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

  private loadUnits(towerId: string | null, interiorId: string | null): void {
    this.buildingService.units(towerId, interiorId).subscribe({
      next: (u) => this.units.set(u),
    });
  }
}
