import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { CommonArea } from '../../core/models/booking.model';
import { BookingService } from '../services/booking.service';

export interface BookingCreateDialogData {
  commonArea: CommonArea;
}

@Component({
  selector: 'app-booking-create-dialog',
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
    MatDatepickerModule,
  ],
  templateUrl: './booking-create-dialog.component.html',
  styleUrl: './booking-create-dialog.component.scss',
})
export class BookingCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<BookingCreateDialogComponent, boolean>);
  private readonly bookingService = inject(BookingService);
  readonly data = inject<BookingCreateDialogData>(MAT_DIALOG_DATA);

  readonly area = this.data.commonArea;

  readonly form = this.fb.nonNullable.group({
    date: [null as Date | null, Validators.required],
    attendees: [null as number | null],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly today = new Date();
  readonly maxDate = computed(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + this.area.advanceDays);
    return d;
  });

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const date = this.form.controls.date.value;
    if (!date) return;

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (start.getTime() < now.getTime()) {
      this.errorMessage.set('No se pueden reservar fechas en el pasado.');
      return;
    }

    const attendees = this.form.controls.attendees.value;
    this.submitting.set(true);
    this.bookingService
      .createBooking({
        commonAreaId: this.area.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        attendees: attendees == null || Number.isNaN(attendees) ? null : attendees,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo crear la reserva. Revise los datos e intente de nuevo.';
          this.errorMessage.set(msg);
        },
      });
  }
}
