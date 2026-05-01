import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { AnnouncementService } from '../services/announcement.service';

const SEED_BUILDING_ID = 'a0000000-0000-0000-0000-000000000001';

interface TowerOption { id: string; name: string; totalFloors: number; }
interface UnitOption { id: string; number: string; floor: number | null; towerName: string | null; }
interface TorreGroup { name: string; towers: TowerOption[]; }

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
  private readonly http = inject(HttpClient);
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

  readonly towers = signal<TowerOption[]>([]);
  readonly allUnits = signal<UnitOption[]>([]);
  readonly torreGroups = signal<TorreGroup[]>([]);
  readonly interiorsForTorre = signal<TowerOption[]>([]);
  readonly filteredUnits = signal<UnitOption[]>([]);
  readonly floorOptions = signal<number[]>([]);

  selectedTorre = '';
  selectedTowerId = '';
  selectedFloor = '';
  selectedUnitId = '';

  ngOnInit(): void {
    this.loadTowers();
    this.loadUnits();
  }

  get currentScope(): string {
    return this.form.controls.scope.value;
  }

  onScopeChange(): void {
    this.selectedTorre = '';
    this.selectedTowerId = '';
    this.selectedFloor = '';
    this.selectedUnitId = '';
    this.interiorsForTorre.set([]);
    this.filteredUnits.set([]);
    this.floorOptions.set([]);
  }

  onTorreChange(torre: string): void {
    this.selectedTorre = torre;
    this.selectedTowerId = '';
    this.selectedFloor = '';
    this.selectedUnitId = '';
    const group = this.torreGroups().find(g => g.name === torre);
    this.interiorsForTorre.set(group?.towers ?? []);
    this.filteredUnits.set([]);
    this.floorOptions.set([]);
  }

  onInteriorChange(towerId: string): void {
    this.selectedTowerId = towerId;
    this.selectedFloor = '';
    this.selectedUnitId = '';
    const tower = this.towers().find(t => t.id === towerId);

    if (this.currentScope === 'FLOOR') {
      const floors: number[] = [];
      for (let i = 1; i <= (tower?.totalFloors ?? 17); i++) floors.push(i);
      this.floorOptions.set(floors);
    }

    if (this.currentScope === 'UNIT') {
      this.filteredUnits.set(
        this.allUnits()
          .filter(u => tower && u.towerName === tower.name)
          .sort((a, b) => {
            const fd = (a.floor ?? 0) - (b.floor ?? 0);
            return fd !== 0 ? fd : parseInt(a.number) - parseInt(b.number);
          }),
      );
    }
  }

  get scopeValue(): string {
    switch (this.currentScope) {
      case 'TOWER': return this.selectedTowerId;
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

  private loadTowers(): void {
    this.http
      .get<ApiResponse<TowerOption[]>>(
        `${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/towers`,
      )
      .subscribe({
        next: (res) => {
          const data = res.data ?? [];
          this.towers.set(data);
          const groups = new Map<string, TowerOption[]>();
          for (const t of data) {
            const match = t.name.match(/^(Torre \d+)/);
            const key = match ? match[1] : t.name;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(t);
          }
          this.torreGroups.set(
            Array.from(groups.entries())
              .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
              .map(([name, towers]) => ({ name, towers })),
          );
        },
      });
  }

  private loadUnits(): void {
    this.http
      .get<ApiResponse<UnitOption[]>>(
        `${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/units`,
      )
      .subscribe({
        next: (res) => this.allUnits.set(res.data ?? []),
      });
  }
}
