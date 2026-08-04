import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DEFAULT_BRANDING, PlatformBranding } from './branding.models';

const CACHE_KEY = 'bakery.branding';

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly branding = signal<PlatformBranding>(this.readCache() ?? DEFAULT_BRANDING);

  /** Load public branding and apply to the document. */
  init(): void {
    this.apply(this.branding());
    this.http
      .get<PlatformBranding>(`${environment.apiBaseUrl}/branding`)
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        if (!data) return;
        const normalized = this.normalize(data);
        this.branding.set(normalized);
        this.writeCache(normalized);
        this.apply(normalized);
      });
  }

  getAdmin(): Observable<PlatformBranding> {
    return this.http.get<PlatformBranding>(`${environment.apiBaseUrl}/admin/branding`);
  }

  update(patch: Partial<PlatformBranding>): Observable<PlatformBranding> {
    return this.http
      .patch<PlatformBranding>(`${environment.apiBaseUrl}/admin/branding`, patch)
      .pipe(
        tap((data) => {
          const normalized = this.normalize(data);
          this.branding.set(normalized);
          this.writeCache(normalized);
          this.apply(normalized);
        }),
      );
  }

  uploadLogo(file: File): Observable<PlatformBranding> {
    const fd = new FormData();
    fd.append('logo', file);
    return this.http
      .post<PlatformBranding>(`${environment.apiBaseUrl}/admin/branding/logo`, fd)
      .pipe(
        tap((data) => {
          const normalized = this.normalize(data);
          this.branding.set(normalized);
          this.writeCache(normalized);
          this.apply(normalized);
        }),
      );
  }

  /** Re-apply after light/dark toggle. */
  reapply(): void {
    this.apply(this.branding());
  }

  apply(data: PlatformBranding): void {
    if (!this.isBrowser) return;
    const root = document.documentElement;
    const dark = root.getAttribute('data-theme') === 'dark';
    root.style.setProperty('--accent', data.accentColor);
    root.style.setProperty('--accent-hover', data.accentStrongColor);
    root.style.setProperty('--accent-soft', this.hexToRgba(data.accentColor, dark ? 0.16 : 0.12));
    root.style.setProperty('--text-accent', dark ? '#fbbf24' : data.accentColor);
    root.style.setProperty('--brand', dark ? '#fde68a' : data.brandColor);
    root.style.setProperty('--brand-soft', this.hexToRgba(data.brandColor, dark ? 0.1 : 0.08));

    const titleBase = data.appName?.trim() || DEFAULT_BRANDING.appName;
    document.title = `${titleBase} — نظام إدارة المخابز`;

    const themeMeta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
    if (themeMeta) themeMeta.content = data.brandColor || DEFAULT_BRANDING.brandColor;

    // Tab icon always follows the brand logo (faviconUrl is kept as a fallback)
    const icon = data.logoUrl || data.faviconUrl;
    if (icon) {
      this.setFavicon(icon);
      this.patchManifestIcons(icon, data);
    }
  }

  private normalize(data: PlatformBranding): PlatformBranding {
    return {
      ...data,
      logoUrl: this.toAbsoluteAssetUrl(data.logoUrl),
      faviconUrl: this.toAbsoluteAssetUrl(data.faviconUrl || data.logoUrl),
    };
  }

  private toAbsoluteAssetUrl(url?: string): string {
    if (!url?.trim()) return '';
    const value = url.trim();
    if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    const base = environment.assetsBaseUrl.replace(/\/$/, '');
    return value.startsWith('/') ? `${base}${value}` : `${base}/${value}`;
  }

  private setFavicon(url: string): void {
    const href = this.withCacheBust(url);
    const type = this.mimeFromUrl(url);

    this.upsertIconLink("link[rel='icon']", 'icon', href, type);
    this.upsertIconLink("link[rel='shortcut icon']", 'shortcut icon', href, type);
    this.upsertIconLink("link[rel='apple-touch-icon']", 'apple-touch-icon', href, type);
  }

  private upsertIconLink(
    selector: string,
    rel: string,
    href: string,
    type: string,
  ): void {
    let link = document.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.type = type;
    // Force browsers to refresh cached favicon
    link.href = href;
  }

  private patchManifestIcons(iconUrl: string, data: PlatformBranding): void {
    const sizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
    const type = this.mimeFromUrl(iconUrl);
    const icons = sizes.map((s) => ({ src: iconUrl, sizes: s, type, purpose: 'maskable any' }));

    const appName = data.appName?.trim() || DEFAULT_BRANDING.appName;
    const manifest = {
      name: `${appName} — نظام إدارة المخابز`,
      short_name: appName,
      lang: 'ar',
      dir: 'rtl',
      theme_color: data.brandColor || '#78350f',
      background_color: '#fefce8',
      display: 'standalone',
      scope: './',
      start_url: './',
      description: 'نظام إدارة المخابز — نقطة بيع، إنتاج، مخزون',
      icons,
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const url = URL.createObjectURL(blob);

    let link = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    if (this.prevManifestBlob) URL.revokeObjectURL(this.prevManifestBlob);
    this.prevManifestBlob = url;
    link.href = url;
  }

  private prevManifestBlob: string | null = null;

  private mimeFromUrl(url: string): string {
    const path = url.split('?')[0].toLowerCase();
    if (path.endsWith('.svg')) return 'image/svg+xml';
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.webp')) return 'image/webp';
    if (path.endsWith('.gif')) return 'image/gif';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
    if (path.endsWith('.ico')) return 'image/x-icon';
    return 'image/png';
  }

  private withCacheBust(url: string): string {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${Date.now()}`;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return `rgba(180, 83, 9, ${alpha})`;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private readCache(): PlatformBranding | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return this.normalize(JSON.parse(raw) as PlatformBranding);
    } catch {
      return null;
    }
  }

  private writeCache(data: PlatformBranding): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota */
    }
  }
}
