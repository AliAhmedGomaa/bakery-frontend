import { Component, computed, inject, input, signal } from '@angular/core';
import { GmnButtonComponent } from '../gmn-button/gmn-button.component';
import { GmnModalComponent } from '../gmn-modal/gmn-modal.component';
import { PwaInstallService } from '../../../core/services/pwa-install.service';
import { BrandingService } from '../../../core/branding/branding.service';
import { AR } from '../../../core/i18n/ar';

@Component({
  selector: 'app-install-app-button',
  standalone: true,
  imports: [GmnButtonComponent, GmnModalComponent],
  template: `
    @if (pwa.showButton()) {
      <button
        type="button"
        class="install-btn"
        [class.install-btn--banner]="variant() === 'banner'"
        [class.install-btn--compact]="variant() === 'compact'"
        (click)="onInstall()"
      >
        <span class="install-btn__icon">📲</span>
        <span class="install-btn__text">
          <strong>{{ variant() === 'compact' ? ar.install.sidebar : installTitle() }}</strong>
          @if (variant() === 'banner') {
            <small>{{ ar.install.subtitle }}</small>
          }
        </span>
        @if (variant() === 'banner') {
          <span class="install-btn__cta">{{ ar.install.action }}</span>
        }
      </button>
    }

    <gmn-modal
      [open]="showGuide()"
      [title]="ar.install.guideTitle"
      size="sm"
      (closed)="showGuide.set(false)"
    >
      <div class="install-guide">
        @if (pwa.isIos()) {
          <ol>
            <li>{{ ar.install.iosStep1 }}</li>
            <li>{{ ar.install.iosStep2 }}</li>
            <li>{{ ar.install.iosStep3 }}</li>
          </ol>
        } @else {
          <p>{{ ar.install.browserHint }}</p>
          <ol>
            <li>{{ ar.install.chromeStep1 }}</li>
            <li>{{ ar.install.chromeStep2 }}</li>
          </ol>
        }
      </div>
      <div footer>
        <gmn-button variant="primary" (clicked)="showGuide.set(false)">{{ ar.install.gotIt }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .install-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      border: none;
      cursor: pointer;
      font-family: inherit;
      text-align: start;
      transition: transform var(--duration-fast) var(--ease-smooth),
        box-shadow var(--duration-fast) var(--ease-smooth);
    }

    .install-btn--banner {
      margin-top: 1.25rem;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, #78350f 0%, #b45309 55%, #d97706 100%);
      color: #fffaf0;
      box-shadow: 0 8px 24px rgba(180, 83, 9, 0.28);
    }

    .install-btn--banner:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(180, 83, 9, 0.34);
    }

    .install-btn--compact {
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-full);
      background: var(--accent-soft);
      color: var(--text-accent);
    }

    .install-btn--compact:hover {
      background: var(--brand-soft);
    }

    .install-btn__icon {
      font-size: 1.5rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .install-btn__text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      flex: 1;
      min-width: 0;
    }

    .install-btn__text strong {
      font-size: 0.9375rem;
      font-weight: 700;
    }

    .install-btn__text small {
      font-size: 0.75rem;
      opacity: 0.9;
      font-weight: 500;
    }

    .install-btn__cta {
      flex-shrink: 0;
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.18);
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .install-guide {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.7;
    }

    .install-guide p {
      margin: 0 0 0.75rem;
    }

    .install-guide ol {
      margin: 0;
      padding-inline-start: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `],
})
export class InstallAppButtonComponent {
  readonly pwa = inject(PwaInstallService);
  private readonly branding = inject(BrandingService);
  readonly ar = AR;
  readonly variant = input<'banner' | 'compact'>('banner');
  readonly showGuide = signal(false);

  installTitle = computed(() => {
    const name = this.branding.branding().appName?.trim() || AR.appName;
    return `${AR.install.titlePrefix} ${name}`;
  });

  async onInstall(): Promise<void> {
    const result = await this.pwa.install();
    if (result === 'ios' || result === 'unavailable') {
      this.showGuide.set(true);
    }
  }
}
