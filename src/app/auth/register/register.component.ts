import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import {
  BuildingService,
  PublicInterior,
  PublicTower,
  PublicUnit,
  SEED_BUILDING_ID,
} from '../../core/services/building.service';

const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (password == null || confirmPassword == null) {
    return null;
  }
  return password === confirmPassword ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly buildingService = inject(BuildingService);

  readonly towers = signal<PublicTower[]>([]);
  readonly interiors = signal<PublicInterior[]>([]);
  readonly filteredUnits = signal<PublicUnit[]>([]);
  readonly selectedTowerId = signal<string>('');
  readonly selectedInteriorId = signal<string>('');

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      idDocument: ['', [Validators.required]],
      unitId: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] },
  );

  submitting = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.buildingService.towers().subscribe({ next: (t) => this.towers.set(t) });
  }

  onTowerChange(towerId: string): void {
    this.selectedTowerId.set(towerId);
    this.selectedInteriorId.set('');
    this.filteredUnits.set([]);
    this.form.controls.unitId.reset();

    this.buildingService.interiors(towerId).subscribe({
      next: (interiors) => {
        this.interiors.set(interiors);
        if (interiors.length === 0) {
          this.buildingService.units(towerId, null).subscribe({ next: u => this.filteredUnits.set(u) });
        }
      },
    });
  }

  onInteriorChange(interiorId: string): void {
    this.selectedInteriorId.set(interiorId);
    this.form.controls.unitId.reset();
    this.buildingService.units(null, interiorId).subscribe({ next: u => this.filteredUnits.set(u) });
  }

  submit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { fullName, email, password, phone, idDocument, unitId } = this.form.getRawValue();

    this.auth
      .register({
        fullName,
        email,
        password,
        phone,
        idDocument,
        buildingId: SEED_BUILDING_ID,
        unitId,
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/dashboard'),
        error: (err) => {
          const msg =
            err?.error?.message ??
            err?.error?.error ??
            err?.message ??
            'No se pudo crear la cuenta. Intenta de nuevo.';
          this.errorMessage = typeof msg === 'string' ? msg : 'Error al registrarse.';
        },
      });
  }

}

