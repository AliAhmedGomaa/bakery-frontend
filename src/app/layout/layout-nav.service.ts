import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutNavService {
  private readonly openSignal = signal(false);

  readonly open = this.openSignal.asReadonly();

  toggle(): void {
    this.openSignal.update((v) => !v);
  }

  show(): void {
    this.openSignal.set(true);
  }

  hide(): void {
    this.openSignal.set(false);
  }
}
