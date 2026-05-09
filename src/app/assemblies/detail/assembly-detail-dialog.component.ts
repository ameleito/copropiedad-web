import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import {
  AgendaItemModel,
  AssemblyItem,
  VoteModel,
} from '../../core/models/assembly.model';
import { AssemblyService } from '../services/assembly.service';

interface VoteResults {
  options: { value: string; count: number; percent: number; isWinner: boolean }[];
  totalVotes: number;
  totalUnits: number;
  attendeeCount: number;
  participationPercent: number;
  quorumRequired: number;
  hasQuorum: boolean;
  winnerOption: string | null;
}

@Component({
  selector: 'app-assembly-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './assembly-detail-dialog.component.html',
  styleUrl: './assembly-detail-dialog.component.scss',
})
export class AssemblyDetailDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<AssemblyDetailDialogComponent, boolean>);
  private readonly assemblyService = inject(AssemblyService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  private readonly initial = inject<AssemblyItem>(MAT_DIALOG_DATA);

  readonly assembly = signal<AssemblyItem>(this.initial);
  readonly agendaItems = signal<AgendaItemModel[]>([]);
  /** Siempre muestra el más reciente (mayor orderNum) primero */
  readonly sortedAgendaItems = computed(() =>
    [...this.agendaItems()].sort((a, b) => b.orderNum - a.orderNum),
  );
  readonly votesByAgendaId = signal<Record<string, VoteModel[]>>({});
  readonly pageLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly statusUpdating = signal(false);
  readonly addAgendaSubmitting = signal(false);
  readonly votingItemId = signal<string | null>(null);
  readonly isRegisteredAttendee = signal(false);
  readonly attendeeRegistering = signal(false);

  readonly showAddAgenda = signal(false);
  readonly selectedStatus = signal(this.initial.status);
  readonly dataChanged = signal(false);

  readonly voteChoice = signal<Record<string, string>>({});

  readonly isAdmin = computed(() => this.auth.getCurrentUser()?.role === 'ADMIN');
  readonly isResident = computed(() => this.auth.getCurrentUser()?.role === 'RESIDENT');

  readonly pendingVoteOptions = signal<string[]>([]);
  readonly newOptionText = signal('');

  // Delete agenda item
  readonly deletingItemId = signal<string | null>(null);

  // Edit agenda item
  readonly editingItemId = signal<string | null>(null);
  readonly editSubmitting = signal(false);
  readonly editPendingVoteOptions = signal<string[]>([]);
  readonly editNewOptionText = signal('');

  readonly editForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    requiresVote: [false],
    voteDurationSeconds: [null as number | null],
  });

  /** Timer countdown: remaining seconds per agenda item id */
  readonly countdowns = signal<Record<string, number>>({});
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  readonly statusOptions = [
    { value: 'CONVOCADA', label: 'Convocada' },
    { value: 'EN_CURSO', label: 'En curso' },
    { value: 'FINALIZADA', label: 'Finalizada' },
    { value: 'CANCELADA', label: 'Cancelada' },
  ];

  readonly addForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    requiresVote: [false],
    voteDurationSeconds: [null as number | null],
  });

  constructor() {
    this.refresh();
    this.startCountdownTimer();
  }

  ngOnDestroy(): void {
    this.stopCountdownTimer();
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      ORDINARIA: 'Ordinaria',
      EXTRAORDINARIA: 'Extraordinaria',
    };
    return map[type] ?? type;
  }

  statusChipColor(status: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case 'CONVOCADA':
        return 'primary';
      case 'EN_CURSO':
        return 'accent';
      case 'FINALIZADA':
        return undefined;
      case 'CANCELADA':
        return 'warn';
      default:
        return undefined;
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      CONVOCADA: 'Convocada',
      EN_CURSO: 'En curso',
      FINALIZADA: 'Finalizada',
      CANCELADA: 'Cancelada',
    };
    return map[status] ?? status;
  }

  getVoteOptionsFor(item: AgendaItemModel): string[] {
    return item.voteOptions ?? [];
  }

  hasVoted(itemId: string): boolean {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) return false;
    const votes = this.votesByAgendaId()[itemId] ?? [];
    return votes.some((v) => v.voterName === currentUser.fullName);
  }

  myVoteFor(itemId: string): string | null {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) return null;
    const votes = this.votesByAgendaId()[itemId] ?? [];
    const mine = votes.find((v) => v.voterName === currentUser.fullName);
    return mine?.option ?? null;
  }

  private _resultsCache = new Map<string, VoteResults>();
  private _resultsCacheKey = '';

  voteResultsFor(item: AgendaItemModel): VoteResults {
    const votesArr = this.votesByAgendaId()[item.id];
    const cacheKey = `${item.id}:${votesArr?.length ?? 0}:${this.assembly().attendeeCount}`;
    if (cacheKey === this._resultsCacheKey && this._resultsCache.has(item.id)) {
      return this._resultsCache.get(item.id)!;
    }

    const votes = votesArr ?? [];
    const totalVotes = votes.length;
    const totalUnits = this.assembly().totalUnits || 1;
    const attendeeCount = this.assembly().attendeeCount;
    const quorumRequired = this.assembly().quorumRequired;
    const participationPercent = totalUnits > 0
      ? Math.round((totalVotes / totalUnits) * 100)
      : 0;
    const hasQuorum = participationPercent >= quorumRequired;

    const counts = new Map<string, number>();
    for (const v of votes) {
      counts.set(v.option, (counts.get(v.option) ?? 0) + 1);
    }

    let maxCount = 0;
    for (const c of counts.values()) {
      if (c > maxCount) maxCount = c;
    }

    const allOptions = item.voteOptions ?? [];
    const options = allOptions.map((opt) => {
      const count = counts.get(opt) ?? 0;
      return {
        value: opt,
        count,
        percent: totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0,
        isWinner: count > 0 && count === maxCount,
      };
    });

    const winners = options.filter((o) => o.isWinner);
    const winnerOption = winners.length === 1 ? winners[0].value : null;

    const result: VoteResults = { options, totalVotes, totalUnits, attendeeCount, participationPercent, quorumRequired, hasQuorum, winnerOption };
    this._resultsCache.set(item.id, result);
    this._resultsCacheKey = cacheKey;
    return result;
  }

  private startCountdownTimer(): void {
    this.timerHandle = setInterval(() => this.tickCountdowns(), 1000);
  }

  private stopCountdownTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private tickCountdowns(): void {
    const items = this.agendaItems();
    const updated: Record<string, number> = {};
    let changed = false;
    for (const item of items) {
      if (!item.requiresVote || !item.voteStartedAt || !item.voteDurationSeconds) continue;
      const startMs = new Date(item.voteStartedAt).getTime();
      const endMs = startMs + item.voteDurationSeconds * 1000;
      const remaining = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
      updated[item.id] = remaining;
      if (remaining === 0 && !item.voteClosed) {
        item.voteClosed = true;
        changed = true;
      }
    }
    this.countdowns.set(updated);
    if (changed) {
      this.agendaItems.update((items) => [...items]);
    }
  }

  isVotingOpen(item: AgendaItemModel): boolean {
    if (!item.requiresVote) return false;
    if (item.voteClosed) return false;
    if (item.voteDurationSeconds && !item.voteStartedAt) return false;
    if (item.voteStartedAt && item.voteDurationSeconds) {
      return (this.countdowns()[item.id] ?? 0) > 0;
    }
    return true;
  }

  isVotingNotStarted(item: AgendaItemModel): boolean {
    return item.requiresVote && !!item.voteDurationSeconds && !item.voteStartedAt && !item.voteClosed;
  }

  formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  startVoting(itemId: string): void {
    this.loadError.set(null);
    this.assemblyService.startVoting(itemId).subscribe({
      next: () => {
        this.dataChanged.set(true);
        this.refresh();
      },
      error: (err) => {
        this.loadError.set(err?.error?.message ?? 'No se pudo iniciar la votación.');
      },
    });
  }

  resetVoting(itemId: string): void {
    this.loadError.set(null);
    this.assemblyService.resetVoting(itemId).subscribe({
      next: () => {
        this.dataChanged.set(true);
        this._resultsCache.clear();
        this._resultsCacheKey = '';
        this.refresh();
      },
      error: (err) => {
        this.loadError.set(err?.error?.message ?? 'No se pudo reiniciar la votación.');
      },
    });
  }

  addVoteOption(): void {
    const text = this.newOptionText().trim();
    if (!text) return;
    if (this.pendingVoteOptions().includes(text)) return;
    this.pendingVoteOptions.update((opts) => [...opts, text]);
    this.newOptionText.set('');
  }

  removeVoteOption(index: number): void {
    this.pendingVoteOptions.update((opts) => opts.filter((_, i) => i !== index));
  }

  pickVote(itemId: string, value: string): void {
    this.voteChoice.update((r) => ({ ...r, [itemId]: value }));
  }

  canEditItem(item: AgendaItemModel): boolean {
    return item.voteStartedAt == null;
  }

  deleteItem(item: AgendaItemModel): void {
    if (!confirm(`¿Eliminar el punto "${item.title}"? Esta acción no se puede deshacer.`)) return;
    this.deletingItemId.set(item.id);
    this.loadError.set(null);
    this.assemblyService
      .deleteAgendaItem(item.id)
      .pipe(finalize(() => this.deletingItemId.set(null)))
      .subscribe({
        next: () => {
          this.dataChanged.set(true);
          this.refresh();
        },
        error: (err) => {
          this.loadError.set(err?.error?.message ?? 'No se pudo eliminar el punto de agenda.');
        },
      });
  }

  openEditItem(item: AgendaItemModel): void {
    this.editingItemId.set(item.id);
    this.editForm.reset({
      title: item.title,
      description: item.description ?? '',
      requiresVote: item.requiresVote,
      voteDurationSeconds: item.voteDurationSeconds ?? null,
    });
    this.editPendingVoteOptions.set(item.voteOptions ? [...item.voteOptions] : []);
    this.editNewOptionText.set('');
  }

  cancelEditItem(): void {
    this.editingItemId.set(null);
    this.editNewOptionText.set('');
  }

  addEditVoteOption(): void {
    const text = this.editNewOptionText().trim();
    if (!text) return;
    if (this.editPendingVoteOptions().includes(text)) return;
    this.editPendingVoteOptions.update((opts) => [...opts, text]);
    this.editNewOptionText.set('');
  }

  removeEditVoteOption(index: number): void {
    this.editPendingVoteOptions.update((opts) => opts.filter((_, i) => i !== index));
  }

  submitEditItem(item: AgendaItemModel): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { title, description, requiresVote, voteDurationSeconds } = this.editForm.getRawValue();
    if (requiresVote && this.editPendingVoteOptions().length < 2) {
      this.loadError.set('Debe agregar al menos 2 opciones de voto.');
      return;
    }
    this.editSubmitting.set(true);
    this.loadError.set(null);
    this.assemblyService
      .updateAgendaItem(item.id, {
        title: title.trim(),
        description: description.trim() || null,
        requiresVote,
        voteOptions: requiresVote ? this.editPendingVoteOptions() : undefined,
        voteDurationSeconds: requiresVote && voteDurationSeconds ? voteDurationSeconds : null,
      })
      .pipe(finalize(() => this.editSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.editingItemId.set(null);
          this.dataChanged.set(true);
          this.refresh();
        },
        error: (err) => {
          this.loadError.set(err?.error?.message ?? 'No se pudo actualizar el tema.');
        },
      });
  }

  close(): void {
    this.dialogRef.close(this.dataChanged());
  }

  toggleAddAgenda(): void {
    this.showAddAgenda.update((v) => !v);
    if (!this.showAddAgenda()) {
      this.addForm.reset({ title: '', description: '', requiresVote: false, voteDurationSeconds: null });
      this.pendingVoteOptions.set([]);
      this.newOptionText.set('');
    }
  }

  registerAsAttendee(): void {
    this.attendeeRegistering.set(true);
    this.loadError.set(null);
    this.assemblyService
      .registerAttendee(this.assembly().id)
      .pipe(finalize(() => this.attendeeRegistering.set(false)))
      .subscribe({
        next: () => {
          this.isRegisteredAttendee.set(true);
          this.dataChanged.set(true);
          this.refresh();
        },
        error: (err) => {
          this.loadError.set(err?.error?.message ?? 'No se pudo registrar como asistente.');
        },
      });
  }

  applyStatus(): void {
    const id = this.assembly().id;
    const status = this.selectedStatus();
    this.statusUpdating.set(true);
    this.loadError.set(null);
    this.assemblyService
      .updateStatus(id, status)
      .pipe(finalize(() => this.statusUpdating.set(false)))
      .subscribe({
        next: (updated) => {
          this.assembly.set(updated);
          this.dataChanged.set(true);
        },
        error: (err) => {
          this.loadError.set(err?.error?.message ?? 'No se pudo actualizar el estado.');
        },
      });
  }

  submitAddAgenda(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const id = this.assembly().id;
    const { title, description, requiresVote, voteDurationSeconds } = this.addForm.getRawValue();
    if (requiresVote && this.pendingVoteOptions().length < 2) {
      this.loadError.set('Debe agregar al menos 2 opciones de voto.');
      return;
    }
    this.addAgendaSubmitting.set(true);
    this.loadError.set(null);
    this.assemblyService
      .addAgendaItem(id, {
        title: title.trim(),
        description: description.trim() || null,
        requiresVote,
        voteOptions: requiresVote ? this.pendingVoteOptions() : undefined,
        voteDurationSeconds: requiresVote && voteDurationSeconds ? voteDurationSeconds : null,
      })
      .pipe(finalize(() => this.addAgendaSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.addForm.reset({ title: '', description: '', requiresVote: false, voteDurationSeconds: null });
          this.pendingVoteOptions.set([]);
          this.newOptionText.set('');
          this.showAddAgenda.set(false);
          this.dataChanged.set(true);
          this.refresh();
        },
        error: (err) => {
          this.loadError.set(err?.error?.message ?? 'No se pudo agregar el punto.');
        },
      });
  }

  submitVote(itemId: string): void {
    const option = this.voteChoice()[itemId];
    if (!option) {
      this.loadError.set('Seleccione una opción de voto.');
      return;
    }
    this.loadError.set(null);
    this.votingItemId.set(itemId);
    this.assemblyService
      .castVote({ agendaItemId: itemId, option })
      .pipe(finalize(() => this.votingItemId.set(null)))
      .subscribe({
        next: () => {
          this.dataChanged.set(true);
          this.reloadVotesFor(itemId);
        },
        error: (err) => {
          this.loadError.set(err?.error?.message ?? 'No se pudo registrar el voto.');
        },
      });
  }

  private reloadVotesFor(itemId: string): void {
    this.assemblyService
      .getVotes(itemId)
      .pipe(catchError(() => of([] as VoteModel[])))
      .subscribe((votes) => {
        this.votesByAgendaId.update((rec) => ({ ...rec, [itemId]: votes }));
      });
  }

  private refresh(): void {
    const id = this.initial.id;
    this.pageLoading.set(true);
    this.loadError.set(null);
    forkJoin({
      detail: this.assemblyService.getDetail(id),
      agenda: this.assemblyService.getAgendaItems(id),
      attendee: this.assemblyService.isAttendee(id).pipe(catchError(() => of(false))),
    })
      .pipe(
        switchMap(({ detail, agenda, attendee }) => {
          this.assembly.set(detail);
          this.selectedStatus.set(detail.status);
          this.isRegisteredAttendee.set(attendee);
          this.agendaItems.set(agenda);
          const voting = agenda.filter((a) => a.requiresVote);
          if (!voting.length) {
            this.votesByAgendaId.set({});
            return of(null);
          }
          return forkJoin(
            voting.map((a) =>
              this.assemblyService.getVotes(a.id).pipe(
                catchError(() => of([] as VoteModel[])),
                map((votes) => ({ id: a.id, votes })),
              ),
            ),
          ).pipe(
            map((pairs) => {
              const rec: Record<string, VoteModel[]> = {};
              for (const p of pairs) rec[p.id] = p.votes;
              this.votesByAgendaId.set(rec);
              return null;
            }),
          );
        }),
        finalize(() => this.pageLoading.set(false)),
      )
      .subscribe({
        error: () => {
          this.loadError.set('No se pudieron cargar los datos de la asamblea.');
        },
      });
  }
}
