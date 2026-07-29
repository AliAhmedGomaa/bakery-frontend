import { Component, computed, inject } from '@angular/core';
import { GmnModalComponent } from '../gmn-modal/gmn-modal.component';
import { GmnButtonComponent } from '../gmn-button/gmn-button.component';
import { ConfirmDialogService } from './confirm-dialog.service';
import { AR } from '../../../core/i18n/ar';

@Component({
  selector: 'gmn-confirm-dialog',
  standalone: true,
  imports: [GmnModalComponent, GmnButtonComponent],
  template: `
    <gmn-modal
      [open]="open()"
      [title]="title()"
      size="sm"
      [dismissible]="true"
      (closed)="dialog.dismiss()"
    >
      <div class="confirm">
        <div class="confirm__icon" aria-hidden="true">⚠</div>
        <p class="confirm__message">{{ message() }}</p>
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="dialog.dismiss()">{{ cancelLabel() }}</gmn-button>
        <gmn-button
          [variant]="danger() ? 'danger' : 'primary'"
          (clicked)="dialog.accept()"
        >
          {{ confirmLabel() }}
        </gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .confirm {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
      padding: 0.25rem 0 0.5rem;
      direction: rtl;
    }
    .confirm__icon {
      width: 3rem;
      height: 3rem;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 1.25rem;
      background: color-mix(in srgb, #c62828 12%, transparent);
      color: #c62828;
      border: 1px solid color-mix(in srgb, #c62828 22%, transparent);
    }
    .confirm__message {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--text-primary);
      font-weight: 500;
      max-width: 22rem;
    }
  `],
})
export class GmnConfirmDialogComponent {
  readonly dialog = inject(ConfirmDialogService);
  private readonly ar = AR;

  private readonly state = this.dialog.state;

  open = computed(() => this.state().open);
  message = computed(() => this.state().message);
  title = computed(() => this.state().title || this.ar.common.confirmTitle);
  confirmLabel = computed(() => this.state().confirmLabel || this.ar.common.delete);
  cancelLabel = computed(() => this.state().cancelLabel || this.ar.common.cancel);
  danger = computed(() => this.state().danger !== false);
}
