import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { UserProfile } from '../../core/models/user.model';
import { PackageService } from '../services/package.service';

interface DialogData {
  packageId: string;
  unitId: string;
}

@Component({
  selector: 'app-package-deliver-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './package-deliver-dialog.component.html',
  styleUrl: './package-deliver-dialog.component.scss',
})
export class PackageDeliverDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly dialogRef = inject(MatDialogRef<PackageDeliverDialogComponent>);
  private readonly pkgService = inject(PackageService);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    deliveredToUserId: ['', Validators.required],
  });

  readonly unitResidents = signal<UserProfile[]>([]);
  submitting = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.http
      .get<ApiResponse<UserProfile[]>>(`${environment.apiUrl}/api/users`, {
        params: { unitId: this.data.unitId },
      })
      .subscribe({
        next: (res) => {
          this.unitResidents.set(res.data ?? []);
        },
        error: () => {
          this.unitResidents.set([]);
        },
      });
  }

  submit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.pkgService
      .deliver(this.data.packageId, { deliveredToUserId: this.form.getRawValue().deliveredToUserId })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'No se pudo registrar la entrega.';
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
