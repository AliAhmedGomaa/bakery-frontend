import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="production">
      <div class="production__header">
        <h1>{{ ar.production.title }}</h1>
        <nav class="production__tabs">
          <a
            class="production__tab"
            routerLink="recipes"
            routerLinkActive="production__tab--active"
          >
            {{ ar.production.recipes }}
          </a>
          <a
            class="production__tab"
            routerLink="batches"
            routerLinkActive="production__tab--active"
          >
            {{ ar.production.batches }}
          </a>
        </nav>
      </div>
      <router-outlet />
    </div>
  `,
  styles: [`
    .production__header {
      margin-bottom: 1.5rem;
    }
    .production__header h1 {
      margin: 0 0 1rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .production__tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0.25rem;
      background: var(--bg-surface-container);
      border-radius: var(--radius-full);
      width: fit-content;
    }
    .production__tab {
      padding: 0.5rem 1.25rem;
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      transition: all var(--duration-fast) ease;

      &:hover { color: var(--text-primary); }
      &--active {
        background: var(--bg-surface);
        color: var(--text-primary);
        font-weight: 600;
        box-shadow: var(--shadow-xs);
      }
    }
  `],
})
export class ProductionComponent {
  readonly ar = AR;
}
