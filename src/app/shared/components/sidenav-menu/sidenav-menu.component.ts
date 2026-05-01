import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
  excludeRoles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'dashboard', label: 'Inicio', route: '/dashboard' },
  { icon: 'description', label: 'PQR', route: '/pqr', excludeRoles: ['SECURITY'] },
  { icon: 'inventory_2', label: 'Paquetes', route: '/packages', excludeRoles: ['ADMIN'] },
  { icon: 'groups', label: 'Visitantes', route: '/visitors', excludeRoles: ['ADMIN'] },
  { icon: 'event_available', label: 'Reservas', route: '/bookings', roles: ['ADMIN', 'RESIDENT'] },
  { icon: 'local_parking', label: 'Parqueadero', route: '/parking', excludeRoles: ['FINANCE'] },
  { icon: 'pets', label: 'Mascotas', route: '/pets', excludeRoles: ['FINANCE'] },
  { icon: 'payments', label: 'Pagos', route: '/finance', roles: ['ADMIN', 'FINANCE', 'RESIDENT'] },
  { icon: 'speed', label: 'Medidores', route: '/meters' },
  { icon: 'campaign', label: 'Anuncios', route: '/announcements' },
  { icon: 'how_to_vote', label: 'Asambleas', route: '/assemblies' },
  { icon: 'folder_open', label: 'Documentos', route: '/documents' },
  { icon: 'report_problem', label: 'Incidentes', route: '/incidents' },
  { icon: 'forum', label: 'Mensajes', route: '/messaging' },
  { icon: 'notifications', label: 'Notificaciones', route: '/notifications' },
  { icon: 'group', label: 'Gestión de Usuarios', route: '/admin/users', roles: ['ADMIN'] },
];

@Component({
  selector: 'app-sidenav-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './sidenav-menu.component.html',
  styleUrl: './sidenav-menu.component.scss',
})
export class SidenavMenuComponent {
  private readonly auth = inject(AuthService);

  readonly visibleItems = computed(() => {
    const role = this.auth.getCurrentUser()?.role ?? '';
    return NAV_ITEMS.filter((item) => {
      if (item.roles && !item.roles.includes(role)) return false;
      if (item.excludeRoles && item.excludeRoles.includes(role)) return false;
      return true;
    });
  });
}
