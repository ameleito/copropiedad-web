import { CommonModule } from '@angular/common';
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
import {
  BuildingService,
  PublicInterior,
  PublicTower,
  PublicUnit,
} from '../../core/services/building.service';
import { FeeTypeResponse } from '../../core/models/finance.model';
import { FinanceService } from '../services/finance.service';

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
  private readonly buildingService = inject(BuildingService);
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

  readonly towers = signal<PublicTower[]>([]);
  readonly interiors = signal<PublicInterior[]>([]);
  readonly filteredUnits = signal<PublicUnit[]>([]);
  readonly feeTypes = signal<FeeTypeResponse[]>([]);

  selectedTowerId = '';
  selectedInteriorId = '';
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
    this.buildingService.towers().subscribe({ next: (t) => this.towers.set(t) });
    this.loadFeeTypes();
  }

  onTowerChange(towerId: string): void {
    this.selectedTowerId = towerId;
    this.selectedInteriorId = '';
    this.form.controls.unitId.reset();
    this.filteredUnits.set([]);

    this.buildingService.interiors(towerId).subscribe({
      next: (interiors) => {
        this.interiors.set(interiors);
        if (interiors.length === 0) {
          this.buildingService.units(towerId, null).subscribe({ next: u => this.filteredUnits.set(u) });
        }
      },
    });
  }

  onInteriorChange(interiorId: string): void {
    this.selectedInteriorId = interiorId;
    this.form.controls.unitId.reset();
    this.buildingService.units(null, interiorId).subscribe({ next: u => this.filteredUnits.set(u) });
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

  private loadFeeTypes(): void {
    this.financeService.listFeeTypes().subscribe({
      next: (data) => this.feeTypes.set(data),
    });
  }
}
