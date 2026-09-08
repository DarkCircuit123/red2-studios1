export interface ResolvedImageUrl { url: string; isValid: boolean; format: 'wix-image' | 'static-wixstatic' | 'base64' | 'blob' | 'http' | 'unknown'; isFallback: boolean; error?: string; }
const FALLBACK_IMAGE_URL = 'https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png';
const IS_DEVELOPMENT = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
const getCallerComponent = (): string => { if (typeof Error === 'undefined') return 'unknown'; const stack = new Error().stack || ''; for (const line of stack.split('\n')) { if (line.includes('at ') && !line.includes('WixImageResolver')) { const match = line.match(/at\s+(\w+)/); if (match) return match[1]; } } return 'unknown'; };

class WixImageResolver {
  static resolve(url: string | undefined | null, context?: { recordId?: string; fieldName?: string }): ResolvedImageUrl {
    if (!url || typeof url !== 'string' || !url.trim()) return { url: FALLBACK_IMAGE_URL, isValid: false, format: 'unknown', isFallback: true, error: 'Empty or null URL provided' };
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('wix:image://v1/')) return { url: trimmedUrl, isValid: true, format: 'wix-image', isFallback: false };
    if (trimmedUrl.startsWith('https://static.wixstatic.com/')) return { url: trimmedUrl, isValid: true, format: 'static-wixstatic', isFallback: false };
    if (trimmedUrl.startsWith('https://')) return { url: trimmedUrl, isValid: true, format: 'http', isFallback: false };
    if (trimmedUrl.startsWith('http://')) return { url: FALLBACK_IMAGE_URL, isValid: false, format: 'http', isFallback: true, error: 'Insecure HTTP image URLs are not supported.' };
    if (trimmedUrl.startsWith('data:image/') || trimmedUrl.startsWith('data:application/')) { if (IS_DEVELOPMENT) console.warn('[WixImageResolver] Base64 image rejected', context); return { url: FALLBACK_IMAGE_URL, isValid: false, format: 'base64', isFallback: true, error: 'Base64 data URLs are not supported.' }; }
    if (trimmedUrl.startsWith('blob:')) { if (IS_DEVELOPMENT) console.warn('[WixImageResolver] Blob URL rejected', context); return { url: FALLBACK_IMAGE_URL, isValid: false, format: 'blob', isFallback: true, error: 'Blob URLs cannot be stored.' }; }
    if (IS_DEVELOPMENT) console.warn('[WixImageResolver] Unknown URL format', { ...context, type: 'unknown' });
    return { url: FALLBACK_IMAGE_URL, isValid: false, format: 'unknown', isFallback: true, error: `Unknown URL format: ${trimmedUrl.substring(0, 50)}...` };
  }

  static isValidWixMediaUrl(url: string | undefined | null): boolean { if (!url || typeof url !== 'string') return false; const trimmed = url.trim(); return trimmed.startsWith('wix:image://v1/') || trimmed.startsWith('https://static.wixstatic.com/'); }
  static isDataUrl(url: string | undefined | null): boolean { if (!url || typeof url !== 'string') return false; const trimmed = url.trim(); return trimmed.startsWith('data:') || trimmed.startsWith('blob:'); }
  static isBlobUrl(url: string | undefined | null): boolean { return typeof url === 'string' && url.trim().startsWith('blob:'); }
  static isBase64Url(url: string | undefined | null): boolean { if (!url || typeof url !== 'string') return false; const trimmed = url.trim(); return trimmed.startsWith('data:image/') || trimmed.startsWith('data:application/'); }
  static getFormat(url: string | undefined | null): ResolvedImageUrl['format'] { if (!url || typeof url !== 'string') return 'unknown'; const trimmed = url.trim(); if (trimmed.startsWith('wix:image://v1/')) return 'wix-image'; if (trimmed.startsWith('https://static.wixstatic.com/')) return 'static-wixstatic'; if (trimmed.startsWith('data:')) return 'base64'; if (trimmed.startsWith('blob:')) return 'blob'; if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return 'http'; return 'unknown'; }
  static validateForCMSStorage(url: string | undefined | null): string | undefined { if (!url || typeof url !== 'string') return 'URL is required'; const trimmed = url.trim(); if (this.isDataUrl(trimmed)) return 'Data and blob URLs cannot be stored in CMS.'; if (trimmed.startsWith('http://')) return 'HTTP URLs cannot be stored in CMS. Use HTTPS.'; if (!this.isValidWixMediaUrl(trimmed) && !trimmed.startsWith('https://')) return 'Only Wix Media Manager URLs or HTTPS URLs are supported.'; return undefined; }
  static getFallbackUrl(): string { return FALLBACK_IMAGE_URL; }
  static resolveBatch(urls: (string | undefined | null)[]): ResolvedImageUrl[] { return urls.map((url) => this.resolve(url)); }
  static filterValidUrls(urls: (string | undefined | null)[]): string[] { return urls.map((url) => this.resolve(url)).filter((resolved) => resolved.isValid).map((resolved) => resolved.url); }
  static debug(url: string | undefined | null) { const resolved = this.resolve(url); const storageError = this.validateForCMSStorage(url); return { original: url, resolved, isStorable: !storageError, storageError }; }
}
export default WixImageResolver;
