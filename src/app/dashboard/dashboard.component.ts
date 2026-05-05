import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly baseFeatures: {
    icon: string; title: string; description: string;
    route: string | null; roles?: string[]; adminOnly?: boolean;
  }[] = [
    {
      icon: 'support_agent',
      title: 'PQR',
      description: 'Peticiones, quejas y reclamos para tu copropiedad.',
      route: '/pqr',
      roles: ['ADMIN', 'RESIDENT', 'MAINTENANCE'],
    },
    {
      icon: 'home',
      title: 'Mi Unidad',
      description: 'Ver y registrar los residentes de tu apartamento.',
      route: '/my-unit',
      roles: ['RESIDENT'],
    },
    {
      icon: 'manage_accounts',
      title: 'Gestión de Usuarios',
      description: 'Crear y administrar usuarios, asignar roles de seguridad y mantenimiento.',
      route: '/admin/users',
      roles: ['ADMIN'],
    },
    {
      icon: 'people',
      title: 'Residentes',
      description: 'Listado de residentes del conjunto, filtrable por torre e interior.',
      route: '/admin/residents',
      roles: ['ADMIN'],
    },
    {
      icon: 'apartment',
      title: 'Gestión de Unidades',
      description: 'Administrar las unidades residenciales del conjunto, con torre e interior.',
      route: '/admin/units',
      roles: ['ADMIN'],
    },
    {
      icon: 'location_city',
      title: 'Gestión de Torres',
      description: 'Crear y editar las torres físicas del conjunto residencial.',
      route: '/admin/towers',
      roles: ['ADMIN'],
    },
    {
      icon: 'meeting_room',
      title: 'Gestión de Interiores',
      description: 'Administrar los interiores que pueden asociarse a cada unidad.',
      route: '/admin/interiors',
      roles: ['ADMIN'],
    },
    {
      icon: 'inventory_2',
      title: 'Paquetes',
      description: 'Registro y entrega de paquetes y correspondencia.',
      route: '/packages',
      roles: ['SECURITY', 'RESIDENT'],
    },
    {
      icon: 'groups',
      title: 'Visitantes',
      description: 'Control de ingreso y visitas a la propiedad.',
      route: '/visitors',
      roles: ['SECURITY', 'RESIDENT'],
    },
    {
      icon: 'local_parking',
      title: 'Parqueadero',
      description: 'Vehículos, cupos y registro de ingreso y salida.',
      route: '/parking',
      roles: ['ADMIN', 'SECURITY', 'RESIDENT'],
    },
    {
      icon: 'event_available',
      title: 'Áreas comunes',
      description: 'Reserva de salones, zonas BBQ, piscina y demás espacios compartidos.',
      route: '/bookings',
      roles: ['ADMIN', 'RESIDENT'],
    },
    {
      icon: 'payments',
      title: 'Pagos',
      description: 'Administración de pagos y estados de cuenta.',
      route: '/finance',
      roles: ['ADMIN', 'FINANCE', 'RESIDENT'],
    },
    {
      icon: 'campaign',
      title: 'Anuncios',
      description: 'Comunicados y avisos importantes para residentes.',
      route: '/announcements',
    },
    {
      icon: 'notifications_active',
      title: 'Notificaciones',
      description: 'Historial de notificaciones y alertas de tu copropiedad.',
      route: '/notifications',
    },
    {
      icon: 'forum',
      title: 'Mensajes',
      description: 'Mensajería directa con administradores y residentes.',
      route: '/messaging',
    },
    {
      icon: 'pets',
      title: 'Mascotas',
      description: 'Registro de mascotas de tu unidad residencial.',
      route: '/pets',
      roles: ['ADMIN', 'RESIDENT', 'SECURITY'],
    },
    {
      icon: 'how_to_vote',
      title: 'Asambleas',
      description: 'Asambleas de copropietarios, agenda y votaciones.',
      route: '/assemblies',
    },
    {
      icon: 'folder_open',
      title: 'Documentos',
      description: 'Reglamentos, actas, circulares y documentos de la copropiedad.',
      route: '/documents',
    },
    {
      icon: 'speed',
      title: 'Medidores',
      description: 'Lecturas de servicios públicos por unidad.',
      route: '/meters',
    },
  ];

  get features() {
    const role = this.auth.getCurrentUser()?.role ?? '';
    return this.baseFeatures.filter(f => !f.roles || f.roles.includes(role));
  }

  navigateTo(route: string | null): void {
    if (route) {
      void this.router.navigateByUrl(route);
    }
  }
}
