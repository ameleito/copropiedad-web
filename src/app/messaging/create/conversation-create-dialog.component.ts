import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import { ApiResponse } from '../../core/models/auth.model';
import { ConversationItem } from '../../core/models/messaging.model';
import { UserProfile } from '../../core/models/user.model';
import { MessagingService } from '../services/messaging.service';

function nonEmptyParticipants(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string[] | undefined;
  return Array.isArray(v) && v.length > 0 ? null : { participants: true };
}

@Component({
  selector: 'app-conversation-create-dialog',
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
  ],
  templateUrl: './conversation-create-dialog.component.html',
  styleUrl: './conversation-create-dialog.component.scss',
})
export class ConversationCreateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly dialogRef = inject(MatDialogRef<ConversationCreateDialogComponent, ConversationItem | undefined>);
  private readonly messaging = inject(MessagingService);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    participantIds: this.fb.nonNullable.control<string[]>([], [nonEmptyParticipants]),
    firstMessage: ['', Validators.required],
  });

  readonly usersLoading = signal(true);
  readonly participantOptions = signal<{ id: string; fullName: string; role: string }[]>([]);
  readonly loadUsersError = signal<string | null>(null);

  saving = false;
  errorMsg: string | null = null;

  ngOnInit(): void {
    const admins$ = this.http.get<ApiResponse<UserProfile[]>>(`${environment.apiUrl}/api/users`, {
      params: { role: 'ADMIN' },
    });
    const all$ = this.http.get<ApiResponse<UserProfile[]>>(`${environment.apiUrl}/api/users`, {});
    forkJoin({ admins: admins$, all: all$ })
      .pipe(
        map(({ admins, all }) => this.mergeParticipants(admins.data ?? [], all.data ?? [])),
        finalize(() => this.usersLoading.set(false)),
      )
      .subscribe({
        next: (merged) => this.participantOptions.set(merged),
        error: () => {
          this.loadUsersError.set('No se pudieron cargar los usuarios.');
          this.participantOptions.set([]);
        },
      });
  }

  submit(): void {
    this.errorMsg = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { subject, participantIds, firstMessage } = this.form.getRawValue();
    this.saving = true;
    this.messaging
      .createConversation({ subject, participantIds, firstMessage })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (conv) => this.dialogRef.close(conv),
        error: () => {
          this.errorMsg = 'No se pudo crear la conversación. Intente de nuevo.';
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private mergeParticipants(admins: UserProfile[], allBuilding: UserProfile[]): { id: string; fullName: string; role: string }[] {
    const selfId = this.auth.getCurrentUser()?.id;
    const byId = new Map<string, { id: string; fullName: string; role: string }>();
    for (const u of admins) {
      if (u.id === selfId) continue;
      byId.set(u.id, { id: u.id, fullName: u.fullName, role: u.role });
    }
    for (const u of allBuilding) {
      if (u.id === selfId) continue;
      if (!byId.has(u.id)) {
        byId.set(u.id, { id: u.id, fullName: u.fullName, role: u.role });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
  }
}
