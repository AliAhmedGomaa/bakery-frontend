import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GmnButtonComponent,
  GmnCardComponent,
  GmnInputComponent,
} from '../../shared/components';
import { BrandingService } from '../../core/branding/branding.service';
import { PlatformBranding } from '../../core/branding/branding.models';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-branding-settings',
  standalone: true,
  imports: [FormsModule, GmnCardComponent, GmnButtonComponent, GmnInputComponent],
  template: `
    <div class="branding">
      <div class="branding__header">
        <div>
          <h1>{{ ar.branding.title }}</h1>
          <p>{{ ar.branding.subtitle }}</p>
        </div>
      </div>

      @if (error()) {
        <p class="branding__msg branding__msg--error">{{ error() }}</p>
      }
      @if (success()) {
        <p class="branding__msg branding__msg--ok">{{ success() }}</p>
      }

      @if (loading()) {
        <p class="branding__muted">{{ ar.branding.loading }}</p>
      } @else {
        <div class="branding__grid">
          <gmn-card>
            <h2>{{ ar.branding.identity }}</h2>
            <div class="branding-form">
              <gmn-input [label]="ar.branding.appName" [(ngModel)]="form.appName" />
              <gmn-input [label]="ar.branding.tagline" [(ngModel)]="form.tagline" />

              <div class="branding-form__colors">
                <div class="branding-form__field">
                  <label>{{ ar.branding.accentColor }}</label>
                  <div class="branding-form__swatch">
                    <input type="color" [(ngModel)]="form.accentColor" />
                    <input type="text" maxlength="7" [(ngModel)]="form.accentColor" />
                  </div>
                </div>
                <div class="branding-form__field">
                  <label>{{ ar.branding.accentStrongColor }}</label>
                  <div class="branding-form__swatch">
                    <input type="color" [(ngModel)]="form.accentStrongColor" />
                    <input type="text" maxlength="7" [(ngModel)]="form.accentStrongColor" />
                  </div>
                </div>
                <div class="branding-form__field">
                  <label>{{ ar.branding.brandColor }}</label>
                  <div class="branding-form__swatch">
                    <input type="color" [(ngModel)]="form.brandColor" />
                    <input type="text" maxlength="7" [(ngModel)]="form.brandColor" />
                  </div>
                </div>
              </div>

              <gmn-button
                variant="primary"
                [loading]="saving()"
                (clicked)="save()"
              >
                {{ ar.branding.save }}
              </gmn-button>
            </div>
          </gmn-card>

          <gmn-card>
            <h2>{{ ar.branding.logo }}</h2>
            <p class="branding__muted">{{ ar.branding.logoHint }}</p>

            @if (preview()?.logoUrl) {
              <div class="branding__logo-preview">
                <img [src]="preview()!.logoUrl" [alt]="ar.branding.logo" />
              </div>
            } @else {
              <p class="branding__muted">{{ ar.branding.noLogo }}</p>
            }

            <label class="branding__upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                [disabled]="uploading()"
                (change)="onLogoSelected($event)"
              />
              <span>{{ uploading() ? ar.branding.uploading : ar.branding.uploadLogo }}</span>
            </label>

            @if (preview(); as b) {
              <div
                class="branding__live"
                [style.--p-accent]="form.accentColor || b.accentColor"
                [style.--p-brand]="form.brandColor || b.brandColor"
              >
                <div class="branding__live-mark">
                  @if (b.logoUrl) {
                    <img [src]="b.logoUrl" alt="" />
                  } @else {
                    <span>{{ (form.appName || b.appName).slice(0, 1) }}</span>
                  }
                </div>
                <div>
                  <strong>{{ form.appName || b.appName }}</strong>
                  <small>{{ form.tagline || b.tagline }}</small>
                </div>
              </div>
            }
          </gmn-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .branding__header {
      margin-bottom: 1.5rem;
    }
    .branding__header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .branding__header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .branding__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
      gap: 1.25rem;
    }
    .branding__grid h2 {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .branding-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      direction: rtl;
    }
    .branding-form__colors {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .branding-form__field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }
    .branding-form__swatch {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .branding-form__swatch input[type='color'] {
      width: 2.75rem;
      height: 2.75rem;
      padding: 0.2rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-default);
      background: var(--bg-surface-container-high);
      cursor: pointer;
    }
    .branding-form__swatch input[type='text'] {
      flex: 1;
      height: 2.75rem;
      padding: 0 1rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-default);
      background: var(--bg-surface-container-high);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.875rem;
      direction: ltr;
      text-align: left;
    }
    .branding__muted {
      margin: 0 0 1rem;
      color: var(--text-muted);
      font-size: 0.8125rem;
    }
    .branding__logo-preview {
      width: 6rem;
      height: 6rem;
      border-radius: var(--radius-xl);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-container);
      margin-bottom: 1rem;
    }
    .branding__logo-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .branding__upload {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.75rem;
      padding: 0 1.25rem;
      border-radius: var(--radius-full);
      border: 1.5px dashed var(--border-default);
      background: var(--bg-surface-container);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 1.25rem;
    }
    .branding__upload input {
      display: none;
    }
    .branding__live {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-subtle);
      background: color-mix(in srgb, var(--p-accent) 10%, var(--bg-surface));
    }
    .branding__live-mark {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--p-brand);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
      flex-shrink: 0;
    }
    .branding__live-mark img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .branding__live strong {
      display: block;
      color: var(--text-primary);
      font-size: 0.9375rem;
    }
    .branding__live small {
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .branding__msg {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-xl);
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .branding__msg--error {
      background: rgba(198, 40, 40, 0.1);
      color: #c62828;
    }
    .branding__msg--ok {
      background: rgba(46, 125, 50, 0.1);
      color: #2e7d32;
    }
  `],
})
export class BrandingSettingsComponent implements OnInit {
  private readonly api = inject(BrandingService);
  readonly ar = AR;

  loading = signal(true);
  saving = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  preview = signal<PlatformBranding | null>(null);

  form = {
    appName: '',
    tagline: '',
    accentColor: '#b45309',
    accentStrongColor: '#92400e',
    brandColor: '#78350f',
  };

  ngOnInit(): void {
    this.api.getAdmin().subscribe({
      next: (data) => {
        this.preview.set(data);
        this.form = {
          appName: data.appName,
          tagline: data.tagline ?? '',
          accentColor: data.accentColor,
          accentStrongColor: data.accentStrongColor,
          brandColor: data.brandColor,
        };
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(AR.branding.loadError);
      },
    });
  }

  save(): void {
    if (!this.form.appName.trim() || this.form.appName.trim().length < 2) {
      this.error.set(AR.branding.nameRequired);
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.update({ ...this.form }).subscribe({
      next: (data) => {
        this.preview.set(data);
        this.saving.set(false);
        this.success.set(AR.branding.saveOk);
      },
      error: () => {
        this.saving.set(false);
        this.error.set(AR.branding.saveError);
      },
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.uploadLogo(file).subscribe({
      next: (data) => {
        this.preview.set(data);
        this.uploading.set(false);
        this.success.set(AR.branding.uploadOk);
      },
      error: () => {
        this.uploading.set(false);
        this.error.set(AR.branding.uploadError);
      },
    });
  }
}
