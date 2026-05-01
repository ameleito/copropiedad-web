import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  CreatePqrRequest,
  PQR_CATEGORY_LABELS,
  PQR_PRIORITY_LABELS,
  PQR_TIPO_LABELS,
  PqrCategory,
  PqrPriority,
  PqrTipo,
} from '../../core/models/pqr.model';
import { PqrService } from '../services/pqr.service';

const MAX_PHOTOS = 5;

export interface PhotoPreviewItem {
  id: string;
  file: File;
  url: string;
}

@Component({
  selector: 'app-pqr-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './pqr-create.component.html',
  styleUrl: './pqr-create.component.scss',
})
export class PqrCreateComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly pqrService = inject(PqrService);
  private readonly router = inject(Router);

  private photoIdSeq = 0;

  readonly tipoLabels = PQR_TIPO_LABELS;
  readonly categoryLabels = PQR_CATEGORY_LABELS;
  readonly priorityLabels = PQR_PRIORITY_LABELS;

  readonly tipos: PqrTipo[] = ['PETICION', 'QUEJA', 'RECLAMO'];
  readonly categorias: PqrCategory[] = [
    'PLOMERIA',
    'ELECTRICIDAD',
    'ZONAS_COMUNES',
    'SEGURIDAD',
    'RUIDO',
    'ASEO',
    'ASCENSOR',
    'FACHADA',
    'OTRO',
  ];
  readonly prioridades: PqrPriority[] = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

  readonly form = this.fb.nonNullable.group({
    tipo: ['' as PqrTipo | '', [Validators.required]],
    category: ['' as PqrCategory | '', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required]],
    priority: ['MEDIA' as PqrPriority, [Validators.required]],
  });

  photoPreviews: PhotoPreviewItem[] = [];
  photoError: string | null = null;
  submitting = false;
  errorMessage: string | null = null;

  ngOnDestroy(): void {
    for (const p of this.photoPreviews) {
      URL.revokeObjectURL(p.url);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
    }
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files?.length) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  addFiles(fileList: FileList): void {
    this.photoError = null;
    const files = Array.from(fileList);
    if (!files.length) {
      return;
    }

    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    const hadNonImages = imageFiles.length < files.length;
    if (hadNonImages && !imageFiles.length) {
      this.photoError = 'Solo se permiten archivos de imagen.';
      return;
    }
    if (hadNonImages) {
      this.photoError = 'Algunos archivos no son imágenes y se omitieron.';
    }

    const slotsLeft = MAX_PHOTOS - this.photoPreviews.length;
    if (slotsLeft <= 0) {
      this.photoError = 'Ya alcanzaste el máximo de 5 fotos.';
      return;
    }

    const toAdd = imageFiles.slice(0, slotsLeft);
    if (imageFiles.length > slotsLeft) {
      this.photoError = `Solo se agregaron ${toAdd.length} foto(s) (máximo 5 en total).`;
    }

    for (const file of toAdd) {
      this.photoPreviews = [
        ...this.photoPreviews,
        {
          id: `p-${Date.now()}-${this.photoIdSeq++}`,
          file,
          url: URL.createObjectURL(file),
        },
      ];
    }
  }

  removePhoto(index: number): void {
    const removed = this.photoPreviews[index];
    if (removed) {
      URL.revokeObjectURL(removed.url);
    }
    this.photoPreviews = this.photoPreviews.filter((_, i) => i !== index);
    this.photoError = null;
  }

  triggerFileInput(input: HTMLInputElement): void {
    input.click();
  }

  submit(): void {
    this.errorMessage = null;
    this.photoError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: CreatePqrRequest = {
      tipo: raw.tipo as PqrTipo,
      category: raw.category as PqrCategory,
      title: raw.title.trim(),
      description: raw.description.trim(),
      priority: raw.priority as PqrPriority,
    };

    const photos = this.photoPreviews.map((p) => p.file);

    this.submitting = true;
    this.pqrService
      .create(request, photos.length ? photos : undefined)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/pqr'),
        error: (err) => {
          const msg =
            err?.error?.message ??
            err?.error?.error ??
            err?.message ??
            'No se pudo enviar la solicitud. Intenta de nuevo.';
          this.errorMessage = typeof msg === 'string' ? msg : 'Ocurrió un error al enviar la solicitud.';
        },
      });
  }
}
