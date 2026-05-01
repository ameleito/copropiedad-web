import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { Incident } from '../../core/models/incident.model';
import { IncidentService } from '../services/incident.service';

@Component({
  selector: 'app-incident-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './incident-detail-dialog.component.html',
  styleUrl: './incident-detail-dialog.component.scss',
})
export class IncidentDetailDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<IncidentDetailDialogComponent>);
  private readonly incidentService = inject(IncidentService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly data: Incident = inject(MAT_DIALOG_DATA);

  readonly resolveForm = this.fb.nonNullable.group({
    resolutionNotes: ['', Validators.required],
  });

  readonly resolving = signal(false);
  readonly resolveError = signal<string | null>(null);

  readonly canResolve = computed(() => {
    if (this.data.resolved) return false;
    const role = this.auth.getCurrentUser()?.role;
    return role === 'ADMIN' || role === 'SECURITY';
  });

  severityChipColor(severity: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (severity) {
      case 'MEDIA':
        return 'primary';
      case 'ALTA':
        return 'accent';
      case 'CRITICA':
        return 'warn';
      default:
        return undefined;
    }
  }

  severityLabel(severity: string): string {
    const map: Record<string, string> = {
      BAJA: 'Baja',
      MEDIA: 'Media',
      ALTA: 'Alta',
      CRITICA: 'Crítica',
    };
    return map[severity] ?? severity;
  }

  submitResolve(): void {
    this.resolveError.set(null);
    if (this.resolveForm.invalid) {
      this.resolveForm.markAllAsTouched();
      return;
    }
    const notes = this.resolveForm.getRawValue().resolutionNotes.trim();
    this.resolving.set(true);
    this.incidentService
      .resolve(this.data.id, notes)
      .pipe(finalize(() => this.resolving.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.resolveError.set(err?.error?.message ?? 'No se pudo resolver el incidente.');
        },
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
