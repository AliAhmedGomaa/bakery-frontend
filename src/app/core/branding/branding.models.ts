export interface PlatformBranding {
  id?: string;
  key?: string;
  appName: string;
  tagline: string;
  accentColor: string;
  accentStrongColor: string;
  brandColor: string;
  logoUrl: string;
  faviconUrl: string;
}

export const DEFAULT_BRANDING: PlatformBranding = {
  appName: 'مخبز',
  tagline: 'سجّل الدخول إلى حسابك',
  accentColor: '#b45309',
  accentStrongColor: '#92400e',
  brandColor: '#78350f',
  logoUrl: '',
  faviconUrl: '',
};
