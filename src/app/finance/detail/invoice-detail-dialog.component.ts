import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../auth/services/auth.service';
import {
  INV_STATUS_COLORS,
  INV_STATUS_LABELS,
  InvoiceResponse,
  PAYMENT_METHOD_LABELS,
  PaymentMethodType,
  PaymentResponse,
} from '../../core/models/finance.model';
import { FinanceService } from '../services/finance.service';

@Component({
  selector: 'app-invoice-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './invoice-detail-dialog.component.html',
  styleUrl: './invoice-detail-dialog.component.scss',
})
export class InvoiceDetailDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<InvoiceDetailDialogComponent>);
  private readonly financeService = inject(FinanceService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly data: InvoiceResponse = inject(MAT_DIALOG_DATA);
  readonly statusLabels = INV_STATUS_LABELS;
  readonly statusColors = INV_STATUS_COLORS;
  readonly methodLabels = PAYMENT_METHOD_LABELS;

  readonly payments = signal<PaymentResponse[]>([]);
  readonly showPayForm = signal(false);
  changed = false;
  paySubmitting = false;

  readonly paymentMethods: { value: PaymentMethodType; label: string }[] = [
    { value: 'PSE', label: 'PSE' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'BANCOLOMBIA', label: 'Bancolombia' },
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
  ];

  readonly payForm = this.fb.nonNullable.group({
    amount: [this.data.totalAmount, [Validators.required, Validators.min(1)]],
    method: ['', Validators.required],
    providerRef: [''],
  });

  get isAdmin(): boolean {
    const role = this.auth.getCurrentUser()?.role;
    return role === 'ADMIN' || role === 'FINANCE';
  }

  get canPay(): boolean {
    return this.data.status === 'PENDIENTE' || this.data.status === 'VENCIDA';
  }

  constructor() {
    this.loadPayments();
  }

  formatPeriod(period: string): string {
    const [y, m] = period.trim().split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  cancelInvoice(): void {
    if (!confirm('¿Está seguro de anular esta factura?')) return;
    this.financeService.cancelInvoice(this.data.id).subscribe({
      next: () => this.dialogRef.close(true),
    });
  }

  submitPayment(): void {
    if (this.payForm.invalid) return;
    this.paySubmitting = true;
    const val = this.payForm.getRawValue();
    this.financeService
      .registerPayment(this.data.id, {
        amount: val.amount,
        method: val.method,
        providerRef: val.providerRef || undefined,
      })
      .subscribe({
        next: () => {
          this.paySubmitting = false;
          this.changed = true;
          this.dialogRef.close(true);
        },
        error: () => (this.paySubmitting = false),
      });
  }

  close(): void {
    this.dialogRef.close(this.changed);
  }

  private loadPayments(): void {
    this.financeService.getPayments(this.data.id).subscribe({
      next: (data) => this.payments.set(data),
    });
  }
}
