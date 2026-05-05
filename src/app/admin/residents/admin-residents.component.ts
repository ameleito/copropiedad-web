import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BuildingService, PublicInterior, PublicTower } from '../../core/services/building.service';
import { UserProfile } from '../../core/models/user.model';
import { ResidentDialogComponent } from './resident-dialog.component';
import { ResidentService } from './resident.service';

@Component({
  selector: 'app-admin-residents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-residents.component.html',
  styleUrl: './admin-residents.component.scss',
})
export class AdminResidentsComponent implements OnInit {
  private readonly residentService = inject(ResidentService);
  private readonly buildingService = inject(BuildingService);
  private readonly dialog = inject(MatDialog);

  readonly residents = signal<UserProfile[]>([]);
  readonly filteredResidents = signal<UserProfile[]>([]);
  readonly loading = signal(false);

  readonly towers = signal<PublicTower[]>([]);
  readonly interiors = signal<PublicInterior[]>([]);

  selectedTowerId = '';
  selectedInteriorId = '';
  searchTerm = '';

  readonly displayedColumns = ['fullName', 'email', 'location', 'phone', 'idDocument', 'actions'];

  ngOnInit(): void {
    this.buildingService.towers().subscribe({ next: t => this.towers.set(t) });
    this.load();
  }

  onTowerChange(towerId: string): void {
    this.selectedTowerId = towerId;
    this.selectedInteriorId = '';
    this.interiors.set([]);
    if (towerId) {
      this.buildingService.interiors(towerId).subscribe({ next: i => this.interiors.set(i) });
    }
    this.load();
  }

  onInteriorChange(interiorId: string): void {
    this.selectedInteriorId = interiorId;
    this.load();
  }

  onSearch(): void {
    this.applyFilter();
  }

  clearFilters(): void {
    this.selectedTowerId = '';
    this.selectedInteriorId = '';
    this.searchTerm = '';
    this.interiors.set([]);
    this.load();
  }

  openCreateDialog(): void {
    this.dialog.open(ResidentDialogComponent, {
      width: '520px',
      disableClose: true,
      data: { adminMode: true },
    }).afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  private load(): void {
    this.loading.set(true);
    this.residentService
      .listAdmin(
        this.selectedTowerId || undefined,
        this.selectedInteriorId || undefined,
      )
      .subscribe({
        next: (data) => {
          this.residents.set(data);
          this.applyFilter();
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredResidents.set(this.residents());
      return;
    }
    this.filteredResidents.set(
      this.residents().filter(r =>
        (r.fullName ?? '').toLowerCase().includes(term) ||
        (r.email ?? '').toLowerCase().includes(term) ||
        (r.unitNumber ?? '').toLowerCase().includes(term) ||
        (r.towerName ?? '').toLowerCase().includes(term) ||
        (r.interiorName ?? '').toLowerCase().includes(term) ||
        (r.idDocument ?? '').toLowerCase().includes(term),
      ),
    );
  }
}
