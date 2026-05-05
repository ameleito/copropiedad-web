import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../core/models/auth.model';
import { UserProfile } from '../core/models/user.model';
import { ResidentDialogComponent } from '../admin/residents/resident-dialog.component';
import { ResidentService } from '../admin/residents/resident.service';

@Component({
  selector: 'app-my-unit',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './my-unit.component.html',
  styleUrl: './my-unit.component.scss',
})
export class MyUnitComponent implements OnInit {
  private readonly residentService = inject(ResidentService);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);

  readonly myProfile = signal<UserProfile | null>(null);
  readonly residents = signal<UserProfile[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.http
      .get<ApiResponse<UserProfile>>(`${environment.apiUrl}/api/users/me`)
      .subscribe({ next: res => this.myProfile.set(res.data ?? null) });
    this.load();
  }

  openAddDialog(): void {
    const p = this.myProfile();
    this.dialog.open(ResidentDialogComponent, {
      width: '520px',
      disableClose: true,
      data: {
        adminMode: false,
        fixedUnit: p?.unitId ? {
          id: p.unitId,
          number: p.unitNumber ?? '',
          towerName: p.towerName,
          interiorName: p.interiorName,
        } : undefined,
      },
    }).afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.residentService.myUnit().subscribe({
      next: (data) => {
        this.residents.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No se pudieron cargar los residentes de tu unidad.');
        this.loading.set(false);
      },
    });
  }
}
