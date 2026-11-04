export const PHOTO_BUCKET = 'jacket-photos';
const inlineImage = /^data:image\/(jpeg|png|webp);base64,([a-z0-9+/=]+)$/i;
const signedCache = new Map();
export function storedPhotoPath(url) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/storage\/v1\/object\/authenticated\/jacket-photos\/([a-f0-9]{64}\.(?:jpeg|png|webp))$/);
    return parsed.protocol === 'https:' && match ? match[1] : null;
  } catch { return null; }
}
export async function uploadPhoto(client, url) {
  const match = typeof url === 'string' && url.match(inlineImage);
  if (!match) return url;
  const bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const path = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('') + '.' + match[1].toLowerCase();
  const bucket = client.storage.from(PHOTO_BUCKET);
  const { error } = await bucket.upload(path, bytes, { contentType: `image/${match[1].toLowerCase()}`, upsert: false, cacheControl: '3600' });
  if (error && !['409', 'Duplicate'].includes(String(error.statusCode)) && error.error !== 'Duplicate') throw error;
  // Verify the stored bytes, including the duplicate/retry case, before replacing
  // any embedded original. Hash names make uploads immutable and deduplicated.
  const downloaded = await bucket.download(path);
  if (downloaded.error) throw downloaded.error;
  const actual = await crypto.subtle.digest('SHA-256', await downloaded.data.arrayBuffer());
  if (String(new Uint8Array(actual)) !== String(new Uint8Array(digest))) throw new Error('تعذر التحقق من الصورة / Image verification failed');
  const publicUrl = bucket.getPublicUrl(path).data.publicUrl;
  return publicUrl.replace('/object/public/', '/object/authenticated/');
}
export async function resolvePhoto(client, url) {
  const path = storedPhotoPath(url);
  if (!path) return url;
  const cached = signedCache.get(url);
  if (cached && cached.expires > Date.now()) return cached.url;
  if (!client) throw new Error('أعد فتح التقرير من النظام / Reopen report from the app');
  const { data, error } = await client.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('تعذر تحميل الصورة / Image unavailable');
  signedCache.set(url, { url: data.signedUrl, expires: Date.now() + 3000000 });
  return data.signedUrl;
}
// Transform only image fields, including JSON-encoded note/history arrays.
// Every other field, caption, crop and original image reference is preserved.
export async function transformPhotos(value, transform, key = '') {
  if (typeof value === 'string') {
    if (['url', 'originalUrl', 'error_image_url'].includes(key)) return transform(value);
    if (['notes', 'status_history', 'error_notes'].includes(key)) {
      let parsed; try { parsed = JSON.parse(value); } catch { return value; }
      return JSON.stringify(await transformPhotos(parsed, transform));
    }
    return value;
  }
  if (Array.isArray(value)) return Promise.all(value.map(item => transformPhotos(item, transform)));
  if (value && typeof value === 'object') {
    const result = {};
    for (const [field, child] of Object.entries(value)) result[field] = await transformPhotos(child, transform, field);
    return result;
  }
  return value;
}
export function openPhotoPrint(client, value, render) {
  const preview = window.open('', '_blank');
  if (!preview) return false;
  preview.opener = null;
  preview.document.write('<!doctype html><meta charset="utf-8"><p>جارٍ تجهيز الصور… / Preparing images…</p>');
  preview.document.close();
  transformPhotos(value, url => resolvePhoto(client, url)).then(resolved => {
    if (preview.closed) return;
    preview.document.open(); preview.document.write(render(resolved)); preview.document.close();
  }).catch(() => {
    if (preview.closed) return;
    preview.document.body.textContent = 'تعذر تحميل الصور. أغلق المعاينة وأعد المحاولة / Images could not load. Close and retry.';
  });
  return true;
}
