import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'bakery_theme';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly isDark = signal(this.loadTheme());

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      const theme = this.isDark() ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(this.KEY, theme);
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }

  private loadTheme(): boolean {
    if (!this.isBrowser) return false;
    const saved = localStorage.getItem(this.KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
