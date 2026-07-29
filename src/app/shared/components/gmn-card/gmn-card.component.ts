import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'gmn-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="gmn-card"
      [ngClass]="{
        'gmn-card--interactive': interactive,
        'gmn-card--flat': variant === 'flat',
        'gmn-card--elevated': variant === 'elevated',
        'gmn-card--glass': variant === 'glass',
        'gmn-card--no-padding': noPadding
      }"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './gmn-card.component.scss',
})
export class GmnCardComponent {
  @Input() variant: 'default' | 'flat' | 'elevated' | 'glass' = 'default';
  @Input() interactive = false;
  @Input() noPadding = false;
}
