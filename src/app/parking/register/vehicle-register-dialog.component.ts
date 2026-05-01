import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { ParkingService } from '../services/parking.service';

@Component({
  selector: 'app-vehicle-register-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './vehicle-register-dialog.component.html',
  styleUrl: './vehicle-register-dialog.component.scss',
})
export class VehicleRegisterDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<VehicleRegisterDialogComponent, boolean>);
  private readonly parkingService = inject(ParkingService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    plate: ['', Validators.required],
    brand: [''],
    model: [''],
    color: [''],
  });

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

    this.submitting.set(true);
    this.parkingService
      .registerVehicle({
        plate,
        brand: raw.brand.trim() || null,
        model: raw.model.trim() || null,
        color: raw.color.trim() || null,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            'No se pudo registrar el vehículo.';
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
}
