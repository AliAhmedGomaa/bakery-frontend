import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'gmn-button',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="gmn-btn"
      [ngClass]="'gmn-btn--' + variant + ' gmn-btn--' + size"
      [class.gmn-btn--loading]="loading"
      [class.gmn-btn--icon-only]="iconOnly"
      [disabled]="disabled || loading"
      [type]="type"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <span class="gmn-btn__spinner"></span>
      }
      <span class="gmn-btn__content" [class.gmn-btn__content--hidden]="loading">
        <ng-content />
      </span>
    </button>
  `,
  styleUrl: './gmn-button.component.scss',
})
export class GmnButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() iconOnly = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
