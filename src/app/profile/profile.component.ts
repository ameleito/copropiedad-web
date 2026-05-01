import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/auth.model';
import { UserProfile } from '../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly baseUrl = environment.apiUrl;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    phone: [''],
    idDocument: [''],
    whatsappOptIn: [false],
    pushOptIn: [false],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  save(): void {
    this.saveError.set(null);
    this.saveSuccess.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.http
      .put<ApiResponse<UserProfile>>(`${this.baseUrl}/api/users/me`, this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.saveSuccess.set(true),
        error: (err) => {
          const msg = err?.error?.message ?? 'No se pudo guardar el perfil.';
          this.saveError.set(typeof msg === 'string' ? msg : 'Error al guardar.');
        },
      });
  }

  private loadProfile(): void {
    this.loadError.set(null);
    this.loading.set(true);

    this.http
      .get<ApiResponse<UserProfile>>(`${this.baseUrl}/api/users/me`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          const profile = res.data;
          this.form.patchValue({
            fullName: profile.fullName ?? '',
            phone: profile.phone ?? '',
            idDocument: profile.idDocument ?? '',
            whatsappOptIn: !!profile.whatsappOptIn,
            pushOptIn: !!profile.pushOptIn,
          });
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'No se pudo cargar el perfil.';
          this.loadError.set(typeof msg === 'string' ? msg : 'Error al cargar.');
        },
      });
  }
}
