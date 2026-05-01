import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs/operators';
import { ParkingSpot } from '../../core/models/parking.model';
import { ParkingService } from '../services/parking.service';

@Component({
  selector: 'app-parking-entry-dialog',
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
  templateUrl: './parking-entry-dialog.component.html',
  styleUrl: './parking-entry-dialog.component.scss',
})
export class ParkingEntryDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ParkingEntryDialogComponent, boolean>);
  private readonly parkingService = inject(ParkingService);

  readonly allSpots = signal<ParkingSpot[]>([]);
  readonly spotsLoading = signal(true);
  readonly spotsError = signal<string | null>(null);

  readonly availableSpots = computed(() =>
    this.allSpots().filter((s) => s.status === 'DISPONIBLE'),
  );

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    plate: ['', Validators.required],
    spotId: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.parkingService
      .listSpots()
      .pipe(finalize(() => this.spotsLoading.set(false)))
      .subscribe({
        next: (spots) => this.allSpots.set(spots ?? []),
        error: () => this.spotsError.set('No se pudieron cargar los cupos.'),
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const plate = raw.plate.trim().toUpperCase();
    if (!plate) {
      this.form.controls.plate.setErrors({ required: true });
      return;
    }

    const spotId = raw.spotId?.trim() || null;

    this.submitting.set(true);
    this.parkingService
      .logEntry({
        plate,
        spotId: spotId || null,
        notes: raw.notes.trim() || null,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            'No se pudo registrar el ingreso.';
          this.errorMessage.set(msg);
        },
      });
  }

  onPlateInput(): void {
    const c = this.form.controls.plate;
    const v = c.value?.toUpperCase() ?? '';
    if (v !== c.value) {
      c.setValue(v, { emitEvent: false });
    }
  }

  spotOptionLabel(s: ParkingSpot): string {
    return s.floor != null ? `${s.spotNumber} — Piso ${s.floor}` : s.spotNumber;
  }
}
