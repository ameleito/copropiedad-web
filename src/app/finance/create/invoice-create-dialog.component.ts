import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { FeeTypeResponse } from '../../core/models/finance.model';
import { FinanceService } from '../services/finance.service';

const SEED_BUILDING_ID = 'a0000000-0000-0000-0000-000000000001';

interface TowerOption { id: string; name: string; totalFloors: number; }
interface UnitOption { id: string; number: string; floor: number | null; towerName: string | null; }
interface TorreGroup { name: string; towers: TowerOption[]; }

@Component({
  selector: 'app-invoice-create-dialog',
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
    MatDatepickerModule,
  ],
  templateUrl: './invoice-create-dialog.component.html',
  styleUrl: './invoice-create-dialog.component.scss',
})
export class InvoiceCreateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly dialogRef = inject(MatDialogRef<InvoiceCreateDialogComponent>);
  private readonly financeService = inject(FinanceService);

  readonly form = this.fb.nonNullable.group({
    unitId: ['', Validators.required],
    feeTypeId: [''],
    period: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    dueDate: [null as Date | null, Validators.required],
    notes: [''],
  });

  readonly towers = signal<TowerOption[]>([]);
  readonly allUnits = signal<UnitOption[]>([]);
  readonly torreGroups = signal<TorreGroup[]>([]);
  readonly interiorsForTorre = signal<TowerOption[]>([]);
  readonly filteredUnits = signal<UnitOption[]>([]);
  readonly feeTypes = signal<FeeTypeResponse[]>([]);

  selectedTorre = '';
  selectedTowerId = '';
  submitting = false;
  errorMessage: string | null = null;

  readonly today = new Date();
  readonly periodOptions: string[] = [];

  constructor() {
    const now = new Date();
    for (let i = -2; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      this.periodOptions.push(`${y}-${m}`);
    }
  }

  ngOnInit(): void {
    this.loadTowers();
    this.loadUnits();
    this.loadFeeTypes();
  }

  onTorreChange(torre: string): void {
    this.selectedTorre = torre;
    this.selectedTowerId = '';
    this.form.controls.unitId.reset();
    const group = this.torreGroups().find(g => g.name === torre);
    this.interiorsForTorre.set(group?.towers ?? []);
    this.filteredUnits.set([]);
  }

  onInteriorChange(towerId: string): void {
    this.selectedTowerId = towerId;
    this.form.controls.unitId.reset();
    const tower = this.towers().find(t => t.id === towerId);
    this.filteredUnits.set(
      this.allUnits()
        .filter(u => tower && u.towerName === tower.name)
        .sort((a, b) => {
          const fd = (a.floor ?? 0) - (b.floor ?? 0);
          return fd !== 0 ? fd : parseInt(a.number) - parseInt(b.number);
        }),
    );
  }

  formatPeriod(period: string): string {
    const [y, m] = period.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  submit(): void {
    this.errorMessage = null;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;

    const val = this.form.getRawValue();
    const dueDate = val.dueDate!;
    const dueDateStr = `${dueDate.getFullYear()}-${(dueDate.getMonth() + 1).toString().padStart(2, '0')}-${dueDate.getDate().toString().padStart(2, '0')}`;

    this.financeService
      .createInvoice({
        unitId: val.unitId,
        feeTypeId: val.feeTypeId || undefined,
        period: val.period,
        amount: val.amount,
        dueDate: dueDateStr,
        notes: val.notes || undefined,
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'No se pudo crear la factura.';
        },
      });
  }

  private loadTowers(): void {
    this.http
      .get<ApiResponse<TowerOption[]>>(`${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/towers`)
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
      .get<ApiResponse<UnitOption[]>>(`${environment.apiUrl}/api/public/buildings/${SEED_BUILDING_ID}/units`)
      .subscribe({ next: (res) => this.allUnits.set(res.data ?? []) });
  }

  private loadFeeTypes(): void {
    this.financeService.listFeeTypes().subscribe({
      next: (data) => this.feeTypes.set(data),
    });
  }
}
