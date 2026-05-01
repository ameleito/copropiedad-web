import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { ConversationItem } from '../../core/models/messaging.model';
import { MessagingService } from '../services/messaging.service';
import { ChatDialogComponent } from '../chat/chat-dialog.component';
import { ConversationCreateDialogComponent } from '../create/conversation-create-dialog.component';

@Component({
  selector: 'app-messaging-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './messaging-list.component.html',
  styleUrl: './messaging-list.component.scss',
})
export class MessagingListComponent {
  private readonly messaging = inject(MessagingService);
  protected readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly items = signal<ConversationItem[]>([]);
  readonly loadError = signal<string | null>(null);

  readonly isAdmin = computed(() => this.auth.getCurrentUser()?.role === 'ADMIN');

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.messaging
      .listConversations()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => this.items.set(list),
        error: () => {
          this.loadError.set('No se pudieron cargar las conversaciones.');
          this.items.set([]);
        },
      });
  }

  openCreate(): void {
    const ref = this.dialog.open(ConversationCreateDialogComponent, {
      width: '520px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((created: ConversationItem | undefined) => {
      if (created) {
        this.refresh();
        this.openChat(created.id);
      }
    });
  }

  openChat(conversationId: string): void {
    this.dialog.open(ChatDialogComponent, {
      width: 'min(560px, 100vw - 32px)',
      maxHeight: '90vh',
      data: { conversationId },
    });
  }

  preview(conv: ConversationItem): string {
    if (conv.lastMessage?.trim()) return conv.lastMessage;
    return 'Sin mensajes aún';
  }

  participantsLabel(conv: ConversationItem): string {
    const names = conv.participantNames ?? [];
    if (!names.length) return 'Participantes';
    return names.join(', ');
  }

  formatTime(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
