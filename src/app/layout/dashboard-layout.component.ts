import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { GmnConfirmDialogComponent } from '../shared/components';
import { LayoutNavService } from './layout-nav.service';
import { BrandingService } from '../core/branding/branding.service';
import { AR } from '../core/i18n/ar';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, GmnConfirmDialogComponent],
  template: `
    <div class="layout" [class.layout--nav-open]="nav.open()">
      <header class="layout__topbar">
        <button
          type="button"
          class="layout__menu-btn"
          [attr.aria-label]="nav.open() ? ar.nav.closeMenu : ar.nav.menu"
          [attr.aria-expanded]="nav.open()"
          (click)="nav.toggle()"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="layout__topbar-brand">
          @if (branding.branding().logoUrl; as logo) {
            <img [src]="logo" [alt]="appName" />
          } @else {
            <span class="layout__topbar-emoji">🍞</span>
          }
          <strong>{{ appName }}</strong>
        </div>
      </header>

      @if (nav.open()) {
        <button
          type="button"
          class="layout__backdrop"
          [attr.aria-label]="ar.nav.closeMenu"
          (click)="nav.hide()"
        ></button>
      }

      <app-sidebar />
      <main class="layout__main">
        <router-outlet />
      </main>
    </div>
    <gmn-confirm-dialog />
  `,
  styles: [`
    .layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
      background: var(--bg-surface-sunken, var(--bg-surface));
    }

    .layout__topbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: sticky;
      top: 0;
      z-index: 40;
      height: 3.5rem;
      padding: 0 0.875rem;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .layout__menu-btn {
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      border-radius: var(--radius-xl);
      background: var(--bg-surface-container-high);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.28rem;
      cursor: pointer;
      flex-shrink: 0;
    }

    .layout__menu-btn span {
      display: block;
      width: 1.1rem;
      height: 2px;
      border-radius: 999px;
      background: var(--text-primary);
    }

    .layout__topbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .layout__topbar-brand img {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: var(--radius-md);
      object-fit: cover;
    }

    .layout__topbar-emoji {
      font-size: 1.25rem;
    }

    .layout__topbar-brand strong {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .layout__backdrop {
      display: none;
    }

    .layout__main {
      flex: 1;
      min-width: 0;
      margin-inline-start: 0;
      padding: 2rem;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      transition: margin-inline-start 0.22s ease;
    }

    .layout--nav-open .layout__main {
      margin-inline-start: 16rem;
    }

    @media (max-width: 960px) {
      .layout__backdrop {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 45;
        border: none;
        background: var(--overlay);
        cursor: pointer;
      }

      .layout--nav-open .layout__main {
        margin-inline-start: 0;
      }

      .layout__main {
        padding: 1rem;
        width: 100%;
      }
    }

    @media (max-width: 640px) {
      .layout__main {
        padding: 0.875rem;
      }
    }
  `],
})
export class DashboardLayoutComponent {
  nav = inject(LayoutNavService);
  branding = inject(BrandingService);
  readonly ar = AR;

  get appName(): string {
    return this.branding.branding().appName?.trim() || AR.appName;
  }
}
