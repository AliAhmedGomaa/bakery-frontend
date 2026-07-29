import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User, Permission } from '../models/types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'bakery_access_token';
  private readonly REFRESH_KEY = 'bakery_refresh_token';
  private readonly USER_KEY = 'bakery_user';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private userSignal = signal<User | null>(this.loadUser());

  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal());
  readonly userRole = computed(() => this.userSignal()?.role ?? null);
  readonly permissions = computed(() => this.userSignal()?.permissions ?? []);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(mobile: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, { mobile, password }).pipe(
      tap((res) => {
        if (!this.isBrowser) return;
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.userSignal.set(res.user);
      }),
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  refreshToken() {
    if (!this.isBrowser) {
      return this.http.post<{ accessToken: string }>(`${environment.apiBaseUrl}/auth/refresh`, {
        refreshToken: null,
      });
    }
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<{ accessToken: string }>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken: refresh }).pipe(
      tap((res) => localStorage.setItem(this.TOKEN_KEY, res.accessToken)),
    );
  }

  hasPermission(...required: Permission[]): boolean {
    const user = this.userSignal();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const perms = user.permissions ?? [];
    return required.some((p) => perms.includes(p));
  }

  /** @deprecated use hasPermission */
  hasRole(...roles: string[]): boolean {
    const role = this.userSignal()?.role;
    return role ? roles.includes(role) : false;
  }

  private loadUser(): User | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
