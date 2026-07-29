import { environment } from '../../../environments/environment';

/** Resolve a stored product image path to a full URL for <img src>. */
export function productImageUrl(image?: string | null): string | null {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  const path = image.startsWith('/') ? image : `/${image}`;
  return `${environment.assetsBaseUrl}${path}`;
}
