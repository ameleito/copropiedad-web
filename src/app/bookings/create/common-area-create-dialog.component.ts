import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { CommonArea } from '../../core/models/booking.model';
import { BookingService } from '../services/booking.service';

export interface CommonAreaDialogData {
  area?: CommonArea;
}

@Component({
  selector: 'app-common-area-create-dialog',
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
    MatCheckboxModule,
  ],
  templateUrl: './common-area-create-dialog.component.html',
  styleUrl: './common-area-create-dialog.component.scss',
})
export class CommonAreaCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CommonAreaCreateDialogComponent, boolean>);
  private readonly bookingService = inject(BookingService);
  private readonly dialogData = inject<CommonAreaDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  readonly editing = !!this.dialogData?.area;
  private readonly editingArea = this.dialogData?.area;

  readonly form = this.fb.nonNullable.group({
    name: [this.editingArea?.name ?? '', Validators.required],
    description: [this.editingArea?.description ?? ''],
    capacity: [this.editingArea?.capacity ?? null as number | null],
    requiresDeposit: [this.editingArea?.requiresDeposit ?? false],
    depositAmount: [this.editingArea?.depositAmount ?? null as number | null],
    maxHours: [this.editingArea?.maxHours ?? 4, [Validators.required, Validators.min(1), Validators.max(24)]],
    advanceDays: [this.editingArea?.advanceDays ?? 30, [Validators.required, Validators.min(0)]],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      name: v.name.trim(),
      description: (v.description ?? '').trim(),
      capacity: v.capacity == null || Number.isNaN(v.capacity) ? null : v.capacity,
      requiresDeposit: v.requiresDeposit,
      depositAmount:
        v.requiresDeposit && v.depositAmount != null && !Number.isNaN(v.depositAmount)
          ? v.depositAmount
          : null,
      maxHours: v.maxHours,
      advanceDays: v.advanceDays,
    };

    this.submitting.set(true);
    const req$ = this.editing
      ? this.bookingService.updateCommonArea(this.editingArea!.id, payload)
      : this.bookingService.createCommonArea(payload);

    req$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg = err?.error?.message || (this.editing ? 'No se pudo actualizar el área común.' : 'No se pudo crear el área común.');
          this.errorMessage.set(msg);
        },
      });
  }
}
