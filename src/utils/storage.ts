/**
 * High-capacity IndexedDB storage helper
 * Prevents QuotaExceededError on browsers while providing instant loading.
 */

const DB_NAME = 'EllisSolonDB';
const DB_VERSION = 2;
const STORE_NAME = 'property_cache';
const VIDEO_STORE_NAME = 'videos_store';
const RECORD_KEY = 'latest_content';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
        db.createObjectStore(VIDEO_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalCache(data: any): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, RECORD_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback to localStorage if small
    try {
      localStorage.setItem('ellis_content_fallback', JSON.stringify(data));
    } catch {
      // ignore
    }
  }
}

export async function getLocalCache(): Promise<any | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(RECORD_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    try {
      const fallback = localStorage.getItem('ellis_content_fallback');
      if (fallback) return JSON.parse(fallback);
    } catch {
      // ignore
    }
    return null;
  }
}

// In-memory cache for created object URLs to prevent duplicate allocations
const activeBlobUrls = new Map<string, string>();

/**
 * Stores a raw video file/blob into IndexedDB
 */
export async function saveVideoBlob(id: string, blob: Blob): Promise<string> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VIDEO_STORE_NAME);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Revoke old object URL if any
    if (activeBlobUrls.has(id)) {
      try {
        URL.revokeObjectURL(activeBlobUrls.get(id)!);
      } catch {
        // ignore
      }
    }

    const objUrl = URL.createObjectURL(blob);
    activeBlobUrls.set(id, objUrl);
    return objUrl;
  } catch (err) {
    console.error('Failed to save video blob to IndexedDB:', err);
    // Return direct object URL as fallback
    const fallbackUrl = URL.createObjectURL(blob);
    activeBlobUrls.set(id, fallbackUrl);
    return fallbackUrl;
  }
}

/**
 * Retrieves a playable object URL for a stored video blob
 */
export async function getVideoBlobUrl(id: string): Promise<string | null> {
  if (activeBlobUrls.has(id)) {
    return activeBlobUrls.get(id)!;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readonly');
      const store = tx.objectStore(VIDEO_STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result;
        if (result instanceof Blob) {
          const url = URL.createObjectURL(result);
          activeBlobUrls.set(id, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Deletes a stored video blob from IndexedDB
 */
export async function deleteVideoBlob(id: string): Promise<void> {
  if (activeBlobUrls.has(id)) {
    try {
      URL.revokeObjectURL(activeBlobUrls.get(id)!);
      activeBlobUrls.delete(id);
    } catch {
      // ignore
    }
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VIDEO_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}
