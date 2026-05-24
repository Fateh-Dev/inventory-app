import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
}

const API_URL = 'http://localhost:5270/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals for state management
  currentUser = signal<UserDto | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const token = localStorage.getItem('fth_token');
    const userJson = localStorage.getItem('fth_user');
    if (token && userJson) {
      try {
        this.currentUser.set(JSON.parse(userJson));
      } catch {
        this.logout();
      }
    }
  }

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/users/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('fth_token', res.token);
        localStorage.setItem('fth_user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout() {
    localStorage.removeItem('fth_token');
    localStorage.removeItem('fth_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<UserDto> {
    return this.http.get<UserDto>(`${API_URL}/users/profile`).pipe(
      tap(user => {
        localStorage.setItem('fth_user', JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  updateProfile(data: { email: string; fullName: string }): Observable<UserDto> {
    return this.http.put<UserDto>(`${API_URL}/users/profile`, data).pipe(
      tap(user => {
        localStorage.setItem('fth_user', JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.post<void>(`${API_URL}/users/profile/change-password`, data);
  }

  // ── User Management (Admin Only) ────────────────────────
  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${API_URL}/users`);
  }

  createUser(data: any): Observable<UserDto> {
    return this.http.post<UserDto>(`${API_URL}/users`, data);
  }

  updateUser(id: string, data: any): Observable<UserDto> {
    return this.http.put<UserDto>(`${API_URL}/users/${id}`, data);
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/users/${id}/deactivate`, {});
  }

  activateUser(id: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/users/${id}/activate`, {});
  }
}
