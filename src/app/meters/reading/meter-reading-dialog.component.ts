import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { MeterService } from '../services/meter.service';

export interface MeterReadingDialogData {
  meterId: string;
}

@Component({
  selector: 'app-meter-reading-dialog',
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
  templateUrl: './meter-reading-dialog.component.html',
  styleUrl: './meter-reading-dialog.component.scss',
})
export class MeterReadingDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<MeterReadingDialogComponent, boolean>);
  private readonly meterService = inject(MeterService);
  readonly data = inject<MeterReadingDialogData>(MAT_DIALOG_DATA);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    period: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
    readingValue: [0, [Validators.required, Validators.min(0)]],
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
    this.submitting.set(true);
    this.meterService
      .registerReading({
        meterId: this.data.meterId,
        period: raw.period.trim(),
        readingValue: raw.readingValue,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            'No se pudo registrar la lectura.';
          this.errorMessage.set(msg);
        },
      });
  }
}
