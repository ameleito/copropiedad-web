import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { DOC_CATEGORY_LABELS, DocCategory, DocItem } from '../../core/models/document.model';
import { DocumentCreateDialogComponent } from '../create/document-create-dialog.component';
import { DocumentService } from '../services/document.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent {
  private readonly documentService = inject(DocumentService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly items = signal<DocItem[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly loadError = signal<string | null>(null);
  readonly categoryFilter = signal<string>('');

  readonly columns = ['title', 'category', 'uploadedBy', 'date', 'actions'];

  readonly categoryOptions: { value: string; label: string }[] = [
    { value: '', label: 'Todas' },
    ...(
      Object.keys(DOC_CATEGORY_LABELS) as DocCategory[]
    ).map((c) => ({ value: c, label: DOC_CATEGORY_LABELS[c] })),
  ];

  readonly isAdmin = this.auth.isAdmin;

  constructor() {
    this.loadDocuments();
  }

  categoryDisplay(category: string): string {
    return DOC_CATEGORY_LABELS[category as DocCategory] ?? category;
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter.set(value);
    this.pageIndex.set(0);
    this.loadDocuments();
  }

  onPage(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.loadDocuments();
  }

  openCreate(): void {
    const ref = this.dialog.open(DocumentCreateDialogComponent, {
      width: '520px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created) => {
      if (created) this.loadDocuments();
    });
  }

  deleteDoc(doc: DocItem, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Está seguro de eliminar este documento?')) return;
    this.documentService.deleteDocument(doc.id).subscribe({
      next: () => this.loadDocuments(),
    });
  }

  private loadDocuments(): void {
    this.loading.set(true);
    this.loadError.set(null);

    const cat = this.categoryFilter();
    const categoryParam = cat || undefined;

    this.documentService
      .listDocuments(this.pageIndex(), this.pageSize(), categoryParam)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
        },
        error: () => {
          this.loadError.set('No se pudieron cargar los documentos. Intente de nuevo.');
          this.items.set([]);
          this.totalElements.set(0);
        },
      });
  }
}
