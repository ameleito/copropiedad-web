import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { AuthService } from '../../auth/services/auth.service';

const SEED_BUILDING_ID = 'a0000000-0000-0000-0000-000000000001';

interface TowerOption {
  id: string;
  name: string;
  totalFloors: number;
}

interface UnitOption {
  id: string;
  number: string;
  floor: number | null;
  type: string;
  towerName: string | null;
}

interface TorreGroup {
  name: string;
  towers: TowerOption[];
}

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
  private readonly http = inject(HttpClient);

  readonly towers = signal<TowerOption[]>([]);
  readonly allUnits = signal<UnitOption[]>([]);
  readonly selectedTorre = signal<string>('');
  readonly selectedTowerId = signal<string>('');

  readonly torreGroups = computed<TorreGroup[]>(() => {
    const groups = new Map<string, TowerOption[]>();
    for (const t of this.towers()) {
      const match = t.name.match(/^(Torre \d+)/);
      const key = match ? match[1] : t.name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([name, towers]) => ({ name, towers }));
  });

  readonly interiorsForTorre = computed(() => {
    const torre = this.selectedTorre();
    if (!torre) return [];
    const group = this.torreGroups().find(g => g.name === torre);
    return group?.towers ?? [];
  });

  readonly filteredUnits = computed(() => {
    const towerId = this.selectedTowerId();
    if (!towerId) return [];
    return this.allUnits()
      .filter(u => {
        const tower = this.towers().find(t => t.id === towerId);
        return tower && u.towerName === tower.name;
      })
      .sort((a, b) => {
        const floorDiff = (a.floor ?? 0) - (b.floor ?? 0);
        if (floorDiff !== 0) return floorDiff;
        return parseInt(a.number) - parseInt(b.number);
      });
  });

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
    this.loadTowers();
    this.loadUnits();
  }

  onTorreChange(torre: string): void {
    this.selectedTorre.set(torre);
    this.selectedTowerId.set('');
    this.form.controls.unitId.reset();
  }

  onInteriorChange(towerId: string): void {
    this.selectedTowerId.set(towerId);
    this.form.controls.unitId.reset();
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

  private loadTowers(): void {
    this.http
      .get<ApiResponse<TowerOption[]>>(
        `${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/towers`,
      )
      .subscribe({
        next: (res) => this.towers.set(res.data ?? []),
        error: () => {},
      });
  }

  private loadUnits(): void {
    this.http
      .get<ApiResponse<UnitOption[]>>(
        `${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/units`,
      )
      .subscribe({
        next: (res) => this.allUnits.set(res.data ?? []),
        error: () => {},
      });
  }
}
