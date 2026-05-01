import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { DOC_CATEGORY_LABELS, DocCategory } from '../../core/models/document.model';
import { DocumentService } from '../services/document.service';

@Component({
  selector: 'app-document-create-dialog',
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
    MatCheckboxModule,
  ],
  templateUrl: './document-create-dialog.component.html',
  styleUrl: './document-create-dialog.component.scss',
})
export class DocumentCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<DocumentCreateDialogComponent>);
  private readonly documentService = inject(DocumentService);

  readonly saving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    category: ['', Validators.required],
    url: [''],
    isPublic: [true],
  });

  readonly categoryOptions: { value: DocCategory; label: string }[] = (
    Object.keys(DOC_CATEGORY_LABELS) as DocCategory[]
  ).map((c) => ({ value: c, label: DOC_CATEGORY_LABELS[c] }));

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMsg.set(null);

    const raw = this.form.getRawValue();
    const urlTrimmed = raw.url?.trim() ?? '';

    this.documentService
      .createDocument({
        title: raw.title.trim(),
        description: raw.description?.trim() || null,
        category: raw.category,
        url: urlTrimmed ? urlTrimmed : null,
        isPublic: raw.isPublic,
      })
      .pipe(
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => this.errorMsg.set('No se pudo registrar el documento. Intente de nuevo.'),
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
