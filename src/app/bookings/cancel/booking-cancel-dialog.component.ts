import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-booking-cancel-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>Cancelar reserva</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Motivo de cancelación</mat-label>
        <textarea matInput rows="3" [formControl]="reasonCtrl"></textarea>
        @if (reasonCtrl.hasError('required') && reasonCtrl.touched) {
          <mat-error>Indique un motivo</mat-error>
        }
        @if (reasonCtrl.hasError('minlength') && reasonCtrl.touched) {
          <mat-error>Mínimo 3 caracteres</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cerrar</button>
      <button mat-flat-button color="warn" type="button" [disabled]="reasonCtrl.invalid" (click)="confirm()">
        Confirmar cancelación
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 300px;
      }
      .full {
        width: 100%;
      }
    `,
  ],
})
export class BookingCancelDialogComponent {
  readonly dialogRef = inject(MatDialogRef<BookingCancelDialogComponent, string | undefined>);
  readonly reasonCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });

  confirm(): void {
    if (this.reasonCtrl.invalid) {
      this.reasonCtrl.markAsTouched();
      return;
    }
    this.dialogRef.close(this.reasonCtrl.value.trim());
  }
}
