import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import {
  AnnouncementResponse,
  SCOPE_ICONS,
  SCOPE_LABELS,
} from '../../core/models/announcement.model';
import { AnnouncementService } from '../services/announcement.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-announcement-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './announcement-detail-dialog.component.html',
  styleUrl: './announcement-detail-dialog.component.scss',
})
export class AnnouncementDetailDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AnnouncementDetailDialogComponent>);
  private readonly announcementService = inject(AnnouncementService);
  private readonly auth = inject(AuthService);

  readonly data: AnnouncementResponse = inject(MAT_DIALOG_DATA);
  readonly scopeLabels = SCOPE_LABELS;
  readonly scopeIcons = SCOPE_ICONS;

  markedRead = false;

  get isAdmin(): boolean {
    return this.auth.getCurrentUser()?.role === 'ADMIN';
  }

  constructor() {
    if (!this.data.read && !this.isAdmin) {
      this.announcementService.markAsRead(this.data.id).subscribe({
        next: () => { this.markedRead = true; },
      });
    }
  }

  close(): void {
    this.dialogRef.close(this.markedRead);
  }

  deleteAndClose(): void {
    if (!confirm('¿Está seguro de eliminar este anuncio?')) return;
    this.announcementService.delete(this.data.id).subscribe({
      next: () => this.dialogRef.close(true),
    });
  }
}
