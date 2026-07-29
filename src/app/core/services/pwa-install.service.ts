import { Injectable, signal, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly canInstall = signal(false);
  readonly isInstalled = signal(false);
  readonly isIos = signal(false);
  readonly showButton = signal(false);

  private readonly onBeforeInstall = (e: Event): void => {
    e.preventDefault();
    this.deferredPrompt = e as BeforeInstallPromptEvent;
    this.canInstall.set(true);
    this.updateVisibility();
  };

  private readonly onAppInstalled = (): void => {
    this.deferredPrompt = null;
    this.canInstall.set(false);
    this.isInstalled.set(true);
    this.updateVisibility();
  };

  constructor() {
    if (!this.isBrowser) return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);

    this.isInstalled.set(!!standalone);

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    this.isIos.set(ios);

    window.addEventListener('beforeinstallprompt', this.onBeforeInstall);
    window.addEventListener('appinstalled', this.onAppInstalled);
    this.updateVisibility();
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstall);
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

  async install(): Promise<'accepted' | 'dismissed' | 'unavailable' | 'ios'> {
    if (this.isInstalled()) return 'unavailable';

    if (this.deferredPrompt) {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.canInstall.set(false);
      if (outcome === 'accepted') {
        this.isInstalled.set(true);
      }
      this.updateVisibility();
      return outcome;
    }

    if (this.isIos()) return 'ios';
    return 'unavailable';
  }

  private updateVisibility(): void {
    this.showButton.set(!this.isInstalled());
  }
}
