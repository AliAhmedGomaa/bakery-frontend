import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { BrandingService } from '../../core/branding/branding.service';
import { Permission } from '../../core/models/types';
import { AR } from '../../core/i18n/ar';
import { InstallAppButtonComponent } from '../../shared/components/install-app-button/install-app-button.component';
import { LayoutNavService } from '../layout-nav.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission: Permission;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, InstallAppButtonComponent],
  template: `
    <aside class="sidebar" [class.sidebar--open]="nav.open()">
      <div class="sidebar__brand">
        @if (branding.branding().logoUrl; as logo) {
          <img class="sidebar__logo-img" [src]="logo" [alt]="appName()" />
        } @else {
          <span class="sidebar__logo">🍞</span>
        }
        <span class="sidebar__title">{{ appName() }}</span>
        <button
          type="button"
          class="sidebar__close"
          [attr.aria-label]="ar.nav.closeMenu"
          (click)="nav.hide()"
        >
          ✕
        </button>
      </div>

      <nav class="sidebar__nav">
        @for (item of visibleItems(); track item.route) {
          <a
            class="sidebar__link"
            [routerLink]="item.route"
            routerLinkActive="sidebar__link--active"
            (click)="nav.hide()"
          >
            <span class="sidebar__link-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar__footer">
        <app-install-app-button variant="compact" />

        <button class="sidebar__theme-toggle" (click)="toggleTheme()">
          <span>{{ theme.isDark() ? '☀️' : '🌙' }}</span>
          <span>{{ theme.isDark() ? ar.nav.lightMode : ar.nav.darkMode }}</span>
        </button>

        <div class="sidebar__user">
          <div class="sidebar__user-avatar">{{ initials() }}</div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">{{ auth.user()?.name }}</span>
            <span class="sidebar__user-role">{{ roleLabel() }}</span>
          </div>
        </div>

        <button class="sidebar__logout" (click)="auth.logout()">
          <span>↗</span>
          <span>{{ ar.nav.logout }}</span>
        </button>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  branding = inject(BrandingService);
  nav = inject(LayoutNavService);
  private router = inject(Router);
  readonly ar = AR;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.nav.hide());
  }

  appName = computed(
    () => this.branding.branding().appName?.trim() || AR.appName,
  );

  private allItems: NavItem[] = [
    { label: AR.nav.dashboard, icon: '📊', route: '/dashboard', permission: Permission.DASHBOARD },
    { label: AR.nav.pos, icon: '🛒', route: '/pos', permission: Permission.POS },
    { label: AR.nav.products, icon: '🥐', route: '/products', permission: Permission.PRODUCTS },
    { label: AR.nav.categories, icon: '🏷️', route: '/categories', permission: Permission.CATEGORIES },
    { label: AR.nav.production, icon: '🏭', route: '/production', permission: Permission.PRODUCTION },
    { label: AR.nav.inventory, icon: '📦', route: '/inventory', permission: Permission.INVENTORY },
    { label: AR.nav.users, icon: '👥', route: '/users', permission: Permission.USERS },
    { label: AR.nav.roles, icon: '🔐', route: '/roles', permission: Permission.ROLES },
    { label: AR.nav.branding, icon: '🎨', route: '/branding', permission: Permission.BRANDING },
  ];

  visibleItems = computed(() => {
    if (!this.auth.isLoggedIn()) return [];
    return this.allItems.filter((item) => this.auth.hasPermission(item.permission));
  });

  initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2);
  });

  roleLabel = computed(() => {
    const user = this.auth.user();
    return user?.roleNameAr || user?.role || '';
  });

  toggleTheme(): void {
    this.theme.toggle();
    this.branding.reapply();
  }
}
