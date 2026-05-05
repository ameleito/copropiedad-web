import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  BuildingService,
  PublicInterior,
  PublicTower,
  PublicUnit,
} from '../../core/services/building.service';
import { AnnouncementService } from '../services/announcement.service';

@Component({
  selector: 'app-announcement-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './announcement-create-dialog.component.html',
  styleUrl: './announcement-create-dialog.component.scss',
})
export class AnnouncementCreateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly buildingService = inject(BuildingService);
  private readonly dialogRef = inject(MatDialogRef<AnnouncementCreateDialogComponent>);
  private readonly announcementService = inject(AnnouncementService);

  saving = false;
  errorMsg: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    body: ['', Validators.required],
    scope: ['ALL'],
    sendPush: [true],
  });

  readonly scopeOptions = [
    { value: 'ALL', label: 'Todos los residentes', icon: 'apartment' },
    { value: 'TOWER', label: 'Torre específica', icon: 'domain' },
    { value: 'FLOOR', label: 'Piso específico', icon: 'layers' },
    { value: 'UNIT', label: 'Unidad específica', icon: 'door_front' },
  ];

  readonly towers = signal<PublicTower[]>([]);
  readonly interiors = signal<PublicInterior[]>([]);
  readonly filteredUnits = signal<PublicUnit[]>([]);
  readonly floorOptions = signal<number[]>([]);

  selectedTowerId = '';
  selectedInteriorId = '';
  selectedFloor = '';
  selectedUnitId = '';

  ngOnInit(): void {
    this.buildingService.towers().subscribe({ next: (t) => this.towers.set(t) });
  }

  get currentScope(): string {
    return this.form.controls.scope.value;
  }

  onScopeChange(): void {
    this.selectedTowerId = '';
    this.selectedInteriorId = '';
    this.selectedFloor = '';
    this.selectedUnitId = '';
    this.interiors.set([]);
    this.filteredUnits.set([]);
    this.floorOptions.set([]);
  }

  onTowerChange(towerId: string): void {
    this.selectedTowerId = towerId;
    this.selectedInteriorId = '';
    this.selectedFloor = '';
    this.selectedUnitId = '';
    this.filteredUnits.set([]);
    this.floorOptions.set([]);

    this.buildingService.interiors(towerId).subscribe({
      next: (interiors) => {
        this.interiors.set(interiors);
        if (interiors.length === 0) {
          this.onInteriorResolved(towerId, null);
        }
      },
    });
  }

  onInteriorChange(interiorId: string): void {
    this.selectedInteriorId = interiorId;
    this.selectedFloor = '';
    this.selectedUnitId = '';
    this.onInteriorResolved(null, interiorId);
  }

  private onInteriorResolved(towerId: string | null, interiorId: string | null): void {
    const tower = this.towers().find(t => t.id === (towerId ?? this.selectedTowerId));

    if (this.currentScope === 'FLOOR') {
      const floors: number[] = [];
      for (let i = 1; i <= (tower?.totalFloors ?? 17); i++) floors.push(i);
      this.floorOptions.set(floors);
    }

    if (this.currentScope === 'UNIT') {
      this.buildingService.units(towerId, interiorId).subscribe({
        next: (u) => this.filteredUnits.set(u),
      });
    }
  }

  get scopeValue(): string {
    switch (this.currentScope) {
      case 'TOWER': return this.selectedInteriorId || this.selectedTowerId;
      case 'FLOOR': return this.selectedFloor;
      case 'UNIT': return this.selectedUnitId;
      default: return '';
    }
  }

  get scopeValueValid(): boolean {
    if (this.currentScope === 'ALL') return true;
    return !!this.scopeValue;
  }

  submit(): void {
    if (this.form.invalid || !this.scopeValueValid) return;
    this.saving = true;
    this.errorMsg = null;

    const { title, body, scope, sendPush } = this.form.getRawValue();

    this.announcementService
      .create({
        title,
        body,
        scope,
        scopeValue: scope === 'ALL' ? undefined : this.scopeValue,
        sendPush,
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => {
          this.saving = false;
          this.errorMsg = 'No se pudo crear el anuncio. Intente de nuevo.';
        },
      });
  }

}

