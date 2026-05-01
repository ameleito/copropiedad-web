import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, UserRole } from '../../core/models/auth.model';
import { UserProfile } from '../../core/models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog.component';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SECURITY: 'Seguridad',
  MAINTENANCE: 'Mantenimiento',
  RESIDENT: 'Residente',
};

type RoleFilter = UserRole | 'ALL';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);

  readonly users = signal<UserProfile[]>([]);
  readonly loading = signal(false);
  readonly roleFilter = signal<RoleFilter>('ALL');

  readonly displayedColumns = ['fullName', 'email', 'role', 'phone', 'unitNumber', 'createdAt', 'actions'];

  readonly roleLabels = ROLE_LABELS;

  readonly filterChips: { value: RoleFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'SECURITY', label: 'Seguridad' },
    { value: 'MAINTENANCE', label: 'Mantenimiento' },
    { value: 'RESIDENT', label: 'Residente' },
  ];

  readonly allRoles: UserRole[] = ['ADMIN', 'SECURITY', 'MAINTENANCE', 'RESIDENT'];

  ngOnInit(): void {
    this.loadUsers();
  }

  setFilter(value: RoleFilter): void {
    this.roleFilter.set(value);
    this.loadUsers();
  }

  chipActive(value: RoleFilter): boolean {
    return this.roleFilter() === value;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '480px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((created) => {
      if (created) this.loadUsers();
    });
  }

  openEditDialog(user: UserProfile): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '480px',
      disableClose: true,
      data: { user },
    });
    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) this.loadUsers();
    });
  }

  changeRole(user: UserProfile, newRole: string): void {
    this.http
      .put<ApiResponse<UserProfile>>(
        `${environment.apiUrl}/api/users/${user.id}/role`,
        { role: newRole },
      )
      .subscribe({
        next: () => this.loadUsers(),
        error: () => {},
      });
  }

  private loadUsers(): void {
    this.loading.set(true);
    const filter = this.roleFilter();
    const params: Record<string, string> = {};
    if (filter !== 'ALL') params['role'] = filter;

    this.http
      .get<ApiResponse<UserProfile[]>>(`${environment.apiUrl}/api/users`, { params })
      .subscribe({
        next: (res) => {
          this.users.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.users.set([]);
          this.loading.set(false);
        },
      });
  }
}
