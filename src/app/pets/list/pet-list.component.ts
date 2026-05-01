import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { Pet } from '../../core/models/pet.model';
import { PetService } from '../services/pet.service';
import { PetRegisterDialogComponent } from '../register/pet-register-dialog.component';

@Component({
  selector: 'app-pet-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './pet-list.component.html',
  styleUrl: './pet-list.component.scss',
})
export class PetListComponent {
  private readonly petService = inject(PetService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly items = signal<Pet[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly deactivatingId = signal<string | null>(null);

  readonly displayedColumns = ['name', 'species', 'breed', 'color', 'unit', 'owner', 'actions'];

  readonly isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');

  readonly canRegisterPet = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'RESIDENT' || role === 'ADMIN';
  });

  constructor() {
    this.loadPets();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadPets();
  }

  openRegister(): void {
    const ref = this.dialog.open(PetRegisterDialogComponent, {
      width: '440px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadPets();
    });
  }

  deactivate(pet: Pet, event: Event): void {
    event.stopPropagation();
    this.actionError.set(null);
    this.deactivatingId.set(pet.id);
    this.petService
      .deactivatePet(pet.id)
      .pipe(finalize(() => this.deactivatingId.set(null)))
      .subscribe({
        next: () => this.loadPets(),
        error: () =>
          this.actionError.set('No se pudo desactivar la mascota. Intente de nuevo.'),
      });
  }

  isDeactivating(pet: Pet): boolean {
    return this.deactivatingId() === pet.id;
  }

  private loadPets(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.petService
      .listPets(this.pageIndex(), this.pageSize())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar las mascotas. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
