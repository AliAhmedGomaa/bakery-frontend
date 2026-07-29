import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'gmn-badge',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="gmn-badge" [ngClass]="'gmn-badge--' + variant + ' gmn-badge--' + size">
      @if (dot) {
        <span class="gmn-badge__dot"></span>
      }
      <ng-content />
    </span>
  `,
  styleUrl: './gmn-badge.component.scss',
})
export class GmnBadgeComponent {
  @Input() variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' = 'neutral';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() dot = false;
}
