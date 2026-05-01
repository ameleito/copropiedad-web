import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { MessageItem } from '../../core/models/messaging.model';
import { MessagingService } from '../services/messaging.service';

export interface ChatDialogData {
  conversationId: string;
}

@Component({
  selector: 'app-chat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './chat-dialog.component.html',
  styleUrl: './chat-dialog.component.scss',
})
export class ChatDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly messaging = inject(MessagingService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly dialogRef = inject(MatDialogRef<ChatDialogComponent>);
  readonly data: ChatDialogData = inject(MAT_DIALOG_DATA);

  readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');

  readonly messages = signal<MessageItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly sending = signal(false);

  readonly currentUserId = computed(() => this.auth.getCurrentUser()?.id ?? '');

  readonly form = this.fb.nonNullable.group({
    body: ['', Validators.required],
  });

  ngOnInit(): void {
    this.fetchMessages({ silent: false });
    interval(5000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.messaging.getMessages(this.data.conversationId, 0, 200)),
      )
      .subscribe({
        next: (page) => this.applyMessagesPage(page),
        error: () => undefined,
      });
  }

  fetchMessages(opts?: { silent?: boolean }): void {
    const silent = !!opts?.silent;
    if (!silent) {
      this.loading.set(true);
      this.loadError.set(null);
    }
    this.messaging
      .getMessages(this.data.conversationId, 0, 200)
      .pipe(
        finalize(() => {
          if (!silent) this.loading.set(false);
        }),
      )
      .subscribe({
        next: (page) => this.applyMessagesPage(page),
        error: () => {
          if (!silent) {
            this.loadError.set('No se pudieron cargar los mensajes.');
            this.messages.set([]);
          }
        },
      });
  }

  send(): void {
    const body = this.form.controls.body.value.trim();
    if (!body || this.sending()) return;
    this.form.controls.body.setValue(body);
    if (this.form.controls.body.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.messaging
      .sendMessage(this.data.conversationId, body)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          this.form.reset({ body: '' });
          this.fetchMessages({ silent: true });
        },
        error: () => {
          this.loadError.set('No se pudo enviar el mensaje.');
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  isOwn(msg: MessageItem): boolean {
    return msg.senderId === this.currentUserId();
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private applyMessagesPage(page: { content?: MessageItem[] }): void {
    this.messages.set([...(page.content ?? [])].sort((a, b) => a.sentAt.localeCompare(b.sentAt)));
    this.scrollToBottomSoon();
  }

  private scrollToBottomSoon(): void {
    queueMicrotask(() => {
      const el = this.viewport()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
