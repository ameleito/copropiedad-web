import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import {
  AddAgendaItemRequest,
  AgendaItemModel,
  AssemblyItem,
  CreateAssemblyRequest,
  VoteModel,
} from '../../core/models/assembly.model';
import { PageResponse } from '../../core/models/visitor.model';

@Injectable({ providedIn: 'root' })
export class AssemblyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/assemblies`;

  listAssemblies(page = 0, size = 20): Observable<PageResponse<AssemblyItem>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http
      .get<ApiResponse<PageResponse<AssemblyItem>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  createAssembly(req: CreateAssemblyRequest): Observable<AssemblyItem> {
    return this.http
      .post<ApiResponse<AssemblyItem>>(this.baseUrl, req)
      .pipe(map((res) => res.data));
  }

  getDetail(id: string): Observable<AssemblyItem> {
    return this.http
      .get<ApiResponse<AssemblyItem>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  addAgendaItem(assemblyId: string, req: AddAgendaItemRequest): Observable<AgendaItemModel> {
    return this.http
      .post<ApiResponse<AgendaItemModel>>(`${this.baseUrl}/${assemblyId}/agenda`, req)
      .pipe(map((res) => res.data));
  }

  getAgendaItems(assemblyId: string): Observable<AgendaItemModel[]> {
    return this.http
      .get<ApiResponse<AgendaItemModel[]>>(`${this.baseUrl}/${assemblyId}/agenda`)
      .pipe(map((res) => res.data));
  }

  castVote(req: { agendaItemId: string; option: string }): Observable<VoteModel> {
    return this.http
      .post<ApiResponse<VoteModel>>(`${environment.apiUrl}/api/assemblies/votes`, req)
      .pipe(map((res) => res.data));
  }

  getVotes(agendaItemId: string): Observable<VoteModel[]> {
    return this.http
      .get<ApiResponse<VoteModel[]>>(`${environment.apiUrl}/api/assemblies/agenda/${agendaItemId}/votes`)
      .pipe(map((res) => res.data));
  }

  registerAttendee(assemblyId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/${assemblyId}/attendees`, {})
      .pipe(map((res) => res.data));
  }

  isAttendee(assemblyId: string): Observable<boolean> {
    return this.http
      .get<ApiResponse<boolean>>(`${this.baseUrl}/${assemblyId}/attendee-status`)
      .pipe(map((res) => res.data));
  }

  updateStatus(assemblyId: string, status: string): Observable<AssemblyItem> {
    return this.http
      .put<ApiResponse<AssemblyItem>>(`${this.baseUrl}/${assemblyId}/status`, { status })
      .pipe(map((res) => res.data));
  }

  startVoting(agendaItemId: string): Observable<AgendaItemModel> {
    return this.http
      .put<ApiResponse<AgendaItemModel>>(`${this.baseUrl}/agenda/${agendaItemId}/start-voting`, {})
      .pipe(map((res) => res.data));
  }

  closeVoting(agendaItemId: string): Observable<AgendaItemModel> {
    return this.http
      .put<ApiResponse<AgendaItemModel>>(`${this.baseUrl}/agenda/${agendaItemId}/close-voting`, {})
      .pipe(map((res) => res.data));
  }

  resetVoting(agendaItemId: string): Observable<AgendaItemModel> {
    return this.http
      .put<ApiResponse<AgendaItemModel>>(`${this.baseUrl}/agenda/${agendaItemId}/reset-voting`, {})
      .pipe(map((res) => res.data));
  }
}
