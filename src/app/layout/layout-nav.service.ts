import { Injectable, signal } from '@angular/core';

const COMPACT_QUERY = '(max-width: 960px)';

@Injectable({ providedIn: 'root' })
export class LayoutNavService {
  private readonly openSignal = signal(this.defaultOpen());

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

  /** Close only in overlay (compact) mode so desktop can stay pinned while navigating. */
  hideIfCompact(): void {
    if (this.isCompact()) {
      this.openSignal.set(false);
    }
  }

  isCompact(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(COMPACT_QUERY).matches;
  }

  private defaultOpen(): boolean {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia(COMPACT_QUERY).matches;
  }
}
