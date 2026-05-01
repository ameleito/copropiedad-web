import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
} from '../../core/models/auth.model';
import { UserInfo } from '../../core/models/user.model';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;

  private readonly _user = signal<UserInfo | null>(this.readStoredUser());

  readonly user = this._user.asReadonly();
  readonly displayName = computed(() => this._user()?.fullName ?? 'Usuario');
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');
  readonly isFinance = computed(() => this._user()?.role === 'FINANCE');
  readonly roleLabel = computed(() => {
    const roleMap: Record<string, string> = {
      RESIDENT: 'Residente',
      ADMIN: 'Administrador',
      SECURITY: 'Seguridad',
      MAINTENANCE: 'Mantenimiento',
      FINANCE: 'Finanzas',
    };
    return roleMap[this._user()?.role ?? ''] ?? 'Residente';
  });

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.baseUrl}/api/auth/login`, payload)
      .pipe(
        map((res) => res.data),
        tap((data) => this.persistSession(data)),
      );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.baseUrl}/api/auth/register`, payload)
      .pipe(
        map((res) => res.data),
        tap((data) => this.persistSession(data)),
      );
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    const body: RefreshRequest = { refreshToken: refreshToken ?? '' };
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.baseUrl}/api/auth/refresh`, body)
      .pipe(
        map((res) => res.data),
        tap((data) => this.persistSession(data)),
      );
  }

  logout(): void {
    this.http.post(`${this.baseUrl}/api/auth/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): UserInfo | null {
    return this._user();
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    void this.router.navigateByUrl('/auth/login');
  }

  private readStoredUser(): UserInfo | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserInfo;
    } catch {
      return null;
    }
  }
}
