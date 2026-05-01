import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/auth.model';
import { Pet } from '../../core/models/pet.model';
import { PageResponse } from '../../core/models/visitor.model';

export interface RegisterPetRequest {
  name: string;
  species: string;
  breed?: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class PetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/pets`;

  listPets(page = 0, size = 20): Observable<PageResponse<Pet>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Pet>>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  registerPet(req: RegisterPetRequest): Observable<Pet> {
    return this.http
      .post<ApiResponse<Pet>>(this.baseUrl, req)
      .pipe(map((res) => res.data));
  }

  deactivatePet(id: string): Observable<Pet> {
    return this.http
      .put<ApiResponse<Pet>>(`${this.baseUrl}/${id}/deactivate`, {})
      .pipe(map((res) => res.data));
  }
}
