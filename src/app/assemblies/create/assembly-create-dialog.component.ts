import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { CreateAssemblyRequest } from '../../core/models/assembly.model';
import { AssemblyService } from '../services/assembly.service';

@Component({
  selector: 'app-assembly-create-dialog',
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
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './assembly-create-dialog.component.html',
  styleUrl: './assembly-create-dialog.component.scss',
})
export class AssemblyCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AssemblyCreateDialogComponent, boolean>);
  private readonly assemblyService = inject(AssemblyService);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    type: ['ORDINARIA', Validators.required],
    scheduledDate: [null as Date | null, Validators.required],
    scheduledTime: ['10:00', Validators.required],
    location: [''],
    virtualLink: [''],
    quorumRequired: [50, [Validators.required, Validators.min(1), Validators.max(100)]],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly today = new Date();

  constructor() {
    if (this.auth.getCurrentUser()?.role !== 'ADMIN') {
      queueMicrotask(() => this.dialogRef.close(false));
    }
  }

  readonly typeOptions = [
    { value: 'ORDINARIA', label: 'Ordinaria' },
    { value: 'EXTRAORDINARIA', label: 'Extraordinaria' },
  ];

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, type, scheduledDate, scheduledTime, location, virtualLink, quorumRequired } =
      this.form.getRawValue();
    if (!scheduledDate) return;

    const scheduledAt = this.combineDateTime(scheduledDate, scheduledTime);
    const req: CreateAssemblyRequest = {
      title: title.trim(),
      type,
      scheduledAt,
      quorumRequired,
      location: location.trim() || null,
      virtualLink: virtualLink.trim() || null,
    };

    this.submitting.set(true);
    this.assemblyService
      .createAssembly(req)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo crear la asamblea. Revise los datos e intente de nuevo.';
          this.errorMessage.set(msg);
        },
      });
  }

  private combineDateTime(d: Date, timeStr: string): string {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0] ?? '0', 10) || 0;
    const m = parseInt(parts[1] ?? '0', 10) || 0;
    const out = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
    return out.toISOString();
  }
}
