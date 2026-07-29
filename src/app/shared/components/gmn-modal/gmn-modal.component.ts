import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'gmn-modal',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <div class="gmn-modal-overlay" (click)="onBackdropClick()">
        <div
          class="gmn-modal-panel"
          [ngClass]="'gmn-modal-panel--' + size"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
        >
          <div class="gmn-modal-panel__header">
            <div>
              @if (title) {
                <h2 class="gmn-modal-panel__title">{{ title }}</h2>
              }
              @if (subtitle) {
                <p class="gmn-modal-panel__subtitle">{{ subtitle }}</p>
              }
            </div>
            @if (dismissible) {
              <button
                class="gmn-modal-panel__close"
                aria-label="Close"
                (click)="close()"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            }
          </div>

          <div class="gmn-modal-panel__body">
            <ng-content />
          </div>

          <div class="gmn-modal-panel__footer">
            <ng-content select="[footer]" />
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './gmn-modal.component.scss',
})
export class GmnModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() dismissible = true;
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && this.dismissible) {
      this.close();
    }
  }

  onBackdropClick(): void {
    if (this.dismissible) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
