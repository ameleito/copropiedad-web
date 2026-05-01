import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../models/auth.model';

export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();
    const role = user?.role;

    if (role && roles.includes(role as UserRole)) {
      return true;
    }

    void router.navigate(['/dashboard']);
    return false;
  };
}
