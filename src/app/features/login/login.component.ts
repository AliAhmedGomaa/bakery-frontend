import { Component, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GmnCardComponent, GmnButtonComponent, GmnInputComponent } from '../../shared/components';
import { InstallAppButtonComponent } from '../../shared/components/install-app-button/install-app-button.component';
import { AuthService } from '../../core/services/auth.service';
import { BrandingService } from '../../core/branding/branding.service';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    GmnCardComponent,
    GmnButtonComponent,
    GmnInputComponent,
    InstallAppButtonComponent,
  ],
  template: `
    <div class="login-page">
      <gmn-card variant="elevated" class="login-card">
        <div class="login-header">
          @if (branding.branding().logoUrl; as logo) {
            <img class="login-logo-img" [src]="logo" [alt]="appName()" />
          } @else {
            <span class="login-logo">🍞</span>
          }
          <h1>{{ appName() }}</h1>
          <p>{{ tagline() }}</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          <gmn-input
            [label]="ar.login.mobile"
            type="tel"
            [error]="error()"
            [(ngModel)]="mobile"
            name="mobile"
          />
          <gmn-input
            [label]="ar.login.password"
            type="password"
            [(ngModel)]="password"
            name="password"
          />

          <gmn-button
            variant="primary"
            type="submit"
            [loading]="loading()"
            size="lg"
          >
            {{ ar.login.submit }}
          </gmn-button>
        </form>

        <app-install-app-button variant="banner" />
      </gmn-card>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      background: var(--bg-surface-container);
    }
    .login-card {
      width: 100%;
      max-width: 24rem;
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-logo {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.75rem;
    }
    .login-logo-img {
      width: 4rem;
      height: 4rem;
      object-fit: cover;
      border-radius: var(--radius-xl);
      display: block;
      margin: 0 auto 0.75rem;
      border: 1px solid var(--border-subtle);
    }
    .login-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .login-header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .login-form gmn-button {
      display: block;
      width: 100%;
      margin-top: 0.5rem;
    }
    .login-form gmn-button ::ng-deep .gmn-btn {
      width: 100%;
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  branding = inject(BrandingService);
  readonly ar = AR;

  appName = computed(
    () => this.branding.branding().appName?.trim() || AR.appName,
  );
  tagline = computed(
    () => this.branding.branding().tagline?.trim() || AR.login.subtitle,
  );

  mobile = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (!this.mobile || !this.password) {
      this.error.set(AR.login.required);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.mobile.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(AR.login.error);
      },
    });
  }
}
