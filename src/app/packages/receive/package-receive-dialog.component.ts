import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import {
  BuildingService,
  PublicInterior,
  PublicTower,
  PublicUnit,
} from '../../core/services/building.service';
import { PackageService } from '../services/package.service';

@Component({
  selector: 'app-package-receive-dialog',
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
  templateUrl: './package-receive-dialog.component.html',
  styleUrl: './package-receive-dialog.component.scss',
})
export class PackageReceiveDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly buildingService = inject(BuildingService);
  private readonly dialogRef = inject(MatDialogRef<PackageReceiveDialogComponent>);
  private readonly pkgService = inject(PackageService);

  readonly form = this.fb.nonNullable.group({
    unitId: ['', Validators.required],
    courier: [''],
    recipientName: [''],
    description: [''],
  });

  readonly towers = signal<PublicTower[]>([]);
  readonly interiors = signal<PublicInterior[]>([]);
  readonly units = signal<PublicUnit[]>([]);

  readonly selectedTowerId = signal<string>('');
  readonly selectedInteriorId = signal<string>('');

  submitting = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.buildingService.towers().subscribe({ next: (t) => this.towers.set(t) });
  }

  onTowerChange(towerId: string): void {
    this.selectedTowerId.set(towerId);
    this.selectedInteriorId.set('');
    this.units.set([]);
    this.form.controls.unitId.reset();

    this.buildingService.interiors(towerId).subscribe({
      next: (interiors) => {
        this.interiors.set(interiors);
        if (interiors.length === 0) {
          this.loadUnits(towerId, null);
        }
      },
    });
  }

  onInteriorChange(interiorId: string): void {
    this.selectedInteriorId.set(interiorId);
    this.form.controls.unitId.reset();
    this.loadUnits(null, interiorId);
  }

  submit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const val = this.form.getRawValue();
    this.pkgService
      .receive({
        unitId: val.unitId,
        courier: val.courier || undefined,
        recipientName: val.recipientName || undefined,
        description: val.description || undefined,
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'No se pudo registrar el paquete.';
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private loadUnits(towerId: string | null, interiorId: string | null): void {
    this.buildingService.units(towerId, interiorId).subscribe({
      next: (u) => this.units.set(u),
    });
  }
}
