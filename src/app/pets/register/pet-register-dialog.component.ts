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
import { finalize } from 'rxjs/operators';
import { PetService } from '../services/pet.service';

@Component({
  selector: 'app-pet-register-dialog',
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
  templateUrl: './pet-register-dialog.component.html',
  styleUrl: './pet-register-dialog.component.scss',
})
export class PetRegisterDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PetRegisterDialogComponent, boolean>);
  private readonly petService = inject(PetService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly speciesOptions = [
    { value: 'Perro', label: 'Perro' },
    { value: 'Gato', label: 'Gato' },
    { value: 'Ave', label: 'Ave' },
    { value: 'Otro', label: 'Otro' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    species: ['', Validators.required],
    breed: [''],
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
    const name = raw.name.trim();
    const species = raw.species.trim();
    if (!name || !species) {
      return;
    }

    this.submitting.set(true);
    this.petService
      .registerPet({
        name,
        species,
        breed: raw.breed.trim() || undefined,
        color: raw.color.trim() || undefined,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          const msg =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            'No se pudo registrar la mascota.';
          this.errorMessage.set(msg);
        },
      });
  }
}
