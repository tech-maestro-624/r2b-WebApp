const BASE_URL = window.location.origin; // This gets your current domain

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const extension = new URL(url).pathname.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  } catch {
    return false;
  }
};

const generateHash = (url) => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
};

export const getCachedImage = async (imageUrl) => {
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${BASE_URL}${imageUrl}`;
  }

  if (!isValidImageUrl(imageUrl)) {
    console.warn('Invalid image URL for caching:', imageUrl);
    return null;
  }

  try {
    if (!('caches' in window)) return imageUrl;

    const cache = await caches.open('image-cache');
    const cached = await cache.match(imageUrl);
    if (cached) {
      const contentType = cached.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        return URL.createObjectURL(await cached.blob());
      } else {
        // Remove invalid cache entry
        await cache.delete(imageUrl);
      }
    }

    const response = await fetch(imageUrl, {
      credentials: 'include',
      mode: 'cors'
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Fetched resource is not an image');
    }
    await cache.put(imageUrl, response.clone());
    return URL.createObjectURL(await response.blob());
  } catch (err) {
    console.warn('Image cache error:', err, imageUrl);
    return null;
  }
};

export const clearImageCache = async () => {
  if ('caches' in window) await caches.delete('image-cache');
};

export const getImageCacheSize = async () => {
  let total = 0;
  if ('caches' in window) {
    const cache = await caches.open('image-cache');
    const keys = await cache.keys();
    for (const req of keys) {
      const res = await cache.match(req);
      if (res) total += (await res.blob()).size;
    }
  }
  return total;
};
