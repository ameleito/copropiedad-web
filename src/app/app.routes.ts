import { Routes } from '@angular/router';
import { AdminUsersComponent } from './admin/users/admin-users.component';
import { AdminUnitsComponent } from './admin/units/admin-units.component';
import { AdminTowersComponent } from './admin/towers/admin-towers.component';
import { AdminInteriorsComponent } from './admin/interiors/admin-interiors.component';
import { AdminResidentsComponent } from './admin/residents/admin-residents.component';
import { MyUnitComponent } from './residents/my-unit.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LayoutComponent } from './layout/layout.component';
import { PackageListComponent } from './packages/list/package-list.component';
import { ProfileComponent } from './profile/profile.component';
import { VisitorListComponent } from './visitors/list/visitor-list.component';
import { AnnouncementListComponent } from './announcements/list/announcement-list.component';
import { InvoiceListComponent } from './finance/list/invoice-list.component';
import { NotificationListComponent } from './notifications/list/notification-list.component';
import { MessagingListComponent } from './messaging/list/messaging-list.component';
import { BookingListComponent } from './bookings/list/booking-list.component';
import { IncidentListComponent } from './incidents/list/incident-list.component';
import { AssemblyListComponent } from './assemblies/list/assembly-list.component';
import { ParkingListComponent } from './parking/list/parking-list.component';
import { PetListComponent } from './pets/list/pet-list.component';
import { MeterListComponent } from './meters/list/meter-list.component';
import { DocumentListComponent } from './documents/list/document-list.component';
import { PqrCreateComponent } from './pqr/create/pqr-create.component';
import { PqrDetailComponent } from './pqr/detail/pqr-detail.component';
import { PqrListComponent } from './pqr/list/pqr-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile/:id', component: ProfileComponent, canActivate: [roleGuard('ADMIN')] },
      { path: 'pqr', component: PqrListComponent },
      { path: 'pqr/new', component: PqrCreateComponent },
      { path: 'pqr/:id', component: PqrDetailComponent },
      { path: 'packages', component: PackageListComponent },
      { path: 'visitors', component: VisitorListComponent },
      { path: 'parking', component: ParkingListComponent },
      { path: 'pets', component: PetListComponent },
      { path: 'announcements', component: AnnouncementListComponent },
      { path: 'incidents', component: IncidentListComponent },
      { path: 'finance', component: InvoiceListComponent },
      { path: 'meters', component: MeterListComponent },
      { path: 'notifications', component: NotificationListComponent },
      { path: 'messaging', component: MessagingListComponent },
      { path: 'bookings', component: BookingListComponent },
      { path: 'assemblies', component: AssemblyListComponent },
      { path: 'documents', component: DocumentListComponent },
      { path: 'admin/users', component: AdminUsersComponent, canActivate: [roleGuard('ADMIN')] },
      { path: 'admin/units', component: AdminUnitsComponent, canActivate: [roleGuard('ADMIN')] },
      { path: 'admin/towers', component: AdminTowersComponent, canActivate: [roleGuard('ADMIN')] },
      { path: 'admin/interiors', component: AdminInteriorsComponent, canActivate: [roleGuard('ADMIN')] },
      { path: 'admin/residents', component: AdminResidentsComponent, canActivate: [roleGuard('ADMIN')] },
      { path: 'my-unit', component: MyUnitComponent, canActivate: [roleGuard('RESIDENT')] },
    ],
  },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: '**', redirectTo: 'dashboard' },
];
