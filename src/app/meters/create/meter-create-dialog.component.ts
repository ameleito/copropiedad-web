import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { MeterService } from '../services/meter.service';

const METER_TYPES = ['AGUA', 'GAS', 'ELECTRICIDAD'] as const;

@Component({
  selector: 'app-meter-create-dialog',
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
  templateUrl: './meter-create-dialog.component.html',
  styleUrl: './meter-create-dialog.component.scss',
})
export class MeterCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<MeterCreateDialogComponent, boolean>);
  private readonly meterService = inject(MeterService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly meterTypes = METER_TYPES;

  readonly form = this.fb.nonNullable.group({
    unitId: ['', Validators.required],
    type: ['AGUA' as string, Validators.required],
    meterNumber: [''],
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
    const meterNumber = raw.meterNumber.trim();
    this.submitting.set(true);
    this.meterService
      .createMeter({
        unitId: raw.unitId.trim(),
        type: raw.type,
        meterNumber: meterNumber ? meterNumber : null,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            'No se pudo crear el medidor.';
          this.errorMessage.set(msg);
        },
      });
  }
}
