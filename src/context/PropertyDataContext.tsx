import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, onSnapshot, writeBatch, collection, deleteDoc } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../firebase';
import { 
  FloorPlan, 
  Amenity, 
  GalleryItem, 
  GalleryCategory, 
  NeighborhoodSpot, 
  SpecialOffer,
  PropertyInfo,
  CommunityVideo,
  SyncDiagnostics,
  Enquiry,
  EmailDeliveryStatus
} from '../types';
import { 
  PROPERTY_INFO as DEFAULT_PROPERTY_INFO, 
  FLOOR_PLANS as DEFAULT_FLOOR_PLANS, 
  AMENITIES as DEFAULT_AMENITIES, 
  GALLERY_ITEMS as DEFAULT_GALLERY_ITEMS, 
  DEFAULT_GALLERY_CATEGORIES,
  NEIGHBORHOOD_SPOTS as DEFAULT_NEIGHBORHOOD_SPOTS, 
  SPECIAL_OFFERS as DEFAULT_SPECIAL_OFFERS,
  DEFAULT_COMMUNITY_VIDEOS
} from '../data/propertyData';
import { saveLocalCache, getLocalCache, getVideoBlobUrl, deleteVideoBlob } from '../utils/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

const QUOTA_EXHAUSTED_KEY = 'firestore_quota_exhausted_timestamp';

// Clean up any stale quota lock left over in browser localStorage from previous sessions
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(QUOTA_EXHAUSTED_KEY);
  }
} catch {
  // ignore
}

let firestoreQuotaExhausted = false;

export async function probeFirestoreWriteQuota(): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { projectId, firestoreDatabaseId, apiKey } = firebaseConfig;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/property_content/quota_probe?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          timestamp: { integerValue: String(Date.now()) },
        },
      }),
    });
    if (res.status === 429) {
      return { ok: false, reason: 'Free daily write quota (20,000 writes/day) is active on Google Cloud.' };
    }
    if (res.ok) {
      return { ok: true };
    }
    const errText = await res.text();
    if (errText.includes('RESOURCE_EXHAUSTED') || errText.includes('Quota limit') || errText.includes('quota')) {
      return { ok: false, reason: 'Free daily write quota reached on Google Cloud.' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

export interface PropertyDataContextType {
  propertyInfo: PropertyInfo;
  floorPlans: FloorPlan[];
  amenities: Amenity[];
  galleryItems: GalleryItem[];
  galleryCategories: GalleryCategory[];
  neighborhoodSpots: NeighborhoodSpot[];
  specialOffers: SpecialOffer[];
  
  // Section-wide bulk save / merge methods (all return Promises that await write completion)
  saveFloorPlans: (plans: FloorPlan[]) => Promise<void>;
  saveAmenities: (amenities: Amenity[]) => Promise<void>;
  saveGalleryItems: (items: GalleryItem[]) => Promise<void>;
  saveNeighborhoodSpots: (spots: NeighborhoodSpot[]) => Promise<void>;
  saveSpecialOffers: (offers: SpecialOffer[]) => Promise<void>;
  savePropertyInfo: (info: PropertyInfo) => Promise<void>;

  // Floor Plans
  addFloorPlan: (plan: FloorPlan) => Promise<void>;
  updateFloorPlan: (id: string, updated: Partial<FloorPlan>) => Promise<void>;
  deleteFloorPlan: (id: string) => Promise<void>;

  // Gallery Photos
  addGalleryPhoto: (photo: GalleryItem) => Promise<void>;
  addGalleryPhotosBatch: (photos: GalleryItem[]) => Promise<void>;
  updateGalleryPhoto: (id: string, updated: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryPhoto: (id: string) => Promise<void>;
  reorderGalleryPhotos: (items: GalleryItem[]) => Promise<void>;

  // Gallery Categories
  addGalleryCategory: (label: string) => Promise<void>;
  removeGalleryCategory: (id: string) => Promise<void>;

  // Amenities
  addAmenity: (amenity: Amenity) => Promise<void>;
  updateAmenity: (id: string, updated: Partial<Amenity>) => Promise<void>;
  deleteAmenity: (id: string) => Promise<void>;

  // Neighborhood Destinations
  addNeighborhoodSpot: (spot: NeighborhoodSpot) => Promise<void>;
  updateNeighborhoodSpot: (id: string, updated: Partial<NeighborhoodSpot>) => Promise<void>;
  deleteNeighborhoodSpot: (id: string) => Promise<void>;

  // Property Details
  updatePropertyInfo: (updated: Partial<PropertyInfo>) => Promise<void>;

  // Discount Coupons & Specials
  addSpecialOffer: (offer: SpecialOffer) => Promise<void>;
  updateSpecialOffer: (id: string, updated: Partial<SpecialOffer>) => Promise<void>;
  deleteSpecialOffer: (id: string) => Promise<void>;

  // Background Cloud Sync Status & Manual Triggers
  cloudSyncStatus: 'idle' | 'syncing' | 'saved' | 'error';
  lastSyncError: string | null;
  isQuotaExhausted: boolean;
  clearQuotaFlag: () => void;
  forceSyncToCloud: (resetQuotaCheck?: boolean) => Promise<{ success: boolean; message?: string } | void>;
  refreshFromCloud: () => Promise<void>;
  diagnostics: SyncDiagnostics;

  // Reset helper
  resetToDefaults: () => Promise<void>;

  // Customer Enquiries & Email Notifications
  enquiries: Enquiry[];
  submitEnquiry: (data: {
    customerName: string;
    phone: string;
    email?: string;
    enquiryType: 'Tour Request' | 'Quick Message' | 'General Enquiry';
    service?: string;
    preferredDate?: string;
    preferredTime?: string;
    floorPlanInterest?: string;
    message?: string;
    location?: string;
    additionalDetails?: Record<string, string>;
  }) => Promise<{ success: boolean; enquiry: Enquiry; emailStatus: EmailDeliveryStatus; emailError?: string }>;
  retryEnquiryEmail: (enquiryId: string) => Promise<{ success: boolean; emailStatus: EmailDeliveryStatus; emailError?: string }>;
  updateEnquiryStatus: (enquiryId: string, status: Enquiry['status']) => Promise<void>;
  deleteEnquiry: (enquiryId: string) => Promise<void>;
}

const PropertyDataContext = createContext<PropertyDataContextType | undefined>(undefined);

// Ultra-fast content fingerprint calculation to skip uploading identical chunks
const computeFingerprint = (val: unknown): string => {
  try {
    const str = JSON.stringify(val);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `${str.length}_${hash}`;
  } catch {
    return String(Date.now());
  }
};

/**
 * Deep cleans any object or array destined for Firestore:
 * - Recursively strips `undefined` keys and values
 * - Replaces top-level undefined with null
 * - Preserves null, empty strings, numbers, booleans, and nested objects
 * - Prevents Firestore serialization errors during complex multi-field updates
 */
export function deepCleanForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as any;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => deepCleanForFirestore(item)) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      cleaned[k] = deepCleanForFirestore(v);
    }
  }
  return cleaned as T;
}

// Partition items into safe chunks strictly under 400KB each to stay well within Firestore's 1MB limit
function partitionIntoSafeChunks<T>(items: T[], maxBytesPerChunk = 400000): T[][] {
  if (!items || items.length === 0) return [];
  const chunks: T[][] = [];
  let currentChunk: T[] = [];
  let currentBytes = 0;

  for (const item of items) {
    let itemStr: string;
    try {
      itemStr = JSON.stringify(item);
    } catch {
      itemStr = '';
    }
    const itemBytes = itemStr.length;

    if (currentChunk.length > 0 && currentBytes + itemBytes > maxBytesPerChunk) {
      chunks.push(currentChunk);
      currentChunk = [item];
      currentBytes = itemBytes;
    } else {
      currentChunk.push(item);
      currentBytes += itemBytes;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Resilient error classifier for Firestore quota limits (RESOURCE_EXHAUSTED / 429) & network timeouts
function isQuotaOrRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const str = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = String((err as any)?.code || '').toLowerCase();
  return (
    code.includes('resource-exhausted') ||
    code.includes('429') ||
    code.includes('quota') ||
    code.includes('deadline-exceeded') ||
    code.includes('unavailable') ||
    str.includes('resource-exhausted') ||
    str.includes('resource_exhausted') ||
    str.includes('quota limit exceeded') ||
    str.includes('quota exceeded') ||
    str.includes('quota metric') ||
    str.includes('429') ||
    str.includes('too many requests') ||
    str.includes('timed out') ||
    str.includes('timeout') ||
    str.includes('deadline exceeded') ||
    str.includes('quota')
  );
}

// Resilient promise timeout helper to prevent hanging cloud operations
const DEFAULT_TIMEOUT_MS = 30000;
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  operationName = 'Firestore operation'
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export const PropertyDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo>(DEFAULT_PROPERTY_INFO);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(DEFAULT_FLOOR_PLANS);
  const [amenities, setAmenities] = useState<Amenity[]>(DEFAULT_AMENITIES);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [galleryCategories, setGalleryCategories] = useState<GalleryCategory[]>(DEFAULT_GALLERY_CATEGORIES);
  const [neighborhoodSpots, setNeighborhoodSpots] = useState<NeighborhoodSpot[]>(DEFAULT_NEIGHBORHOOD_SPOTS);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>(DEFAULT_SPECIAL_OFFERS);

  // Enquiries state with local cache fallback
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    try {
      const stored = localStorage.getItem('ellis_cached_enquiries');
      if (stored) {
        const parsed = JSON.parse(stored) as Enquiry[];
        return parsed.map((e) => ({
          ...e,
          emailRecipient:
            !e.emailRecipient || e.emailRecipient === 'aibrandorigin@gmail.com'
              ? DEFAULT_PROPERTY_INFO.email || 'ellisonsolon@gmail.com'
              : e.emailRecipient,
        }));
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Sync enquiries with Firestore live collection
  useEffect(() => {
    try {
      const colRef = collection(db, 'enquiries');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const loaded: Enquiry[] = [];
          const fallbackEmail = latestStateRef.current.propertyInfo?.email || DEFAULT_PROPERTY_INFO.email || 'ellisonsolon@gmail.com';
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Enquiry;
            loaded.push({
              ...data,
              emailRecipient:
                !data.emailRecipient || data.emailRecipient === 'aibrandorigin@gmail.com'
                  ? fallbackEmail
                  : data.emailRecipient,
            });
          });
          loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setEnquiries(loaded);
          try {
            localStorage.setItem('ellis_cached_enquiries', JSON.stringify(loaded));
          } catch {}
        },
        (err) => {
          console.warn('Firestore enquiries collection subscription notice:', err.message);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not setup enquiries snapshot listener:', e);
    }
  }, []);

  // Synchronous mutable state container to completely avoid stale closures across rapid updates
  const latestStateRef = useRef({
    propertyInfo: DEFAULT_PROPERTY_INFO as PropertyInfo,
    floorPlans: DEFAULT_FLOOR_PLANS as FloorPlan[],
    amenities: DEFAULT_AMENITIES as Amenity[],
    galleryItems: DEFAULT_GALLERY_ITEMS as GalleryItem[],
    galleryCategories: DEFAULT_GALLERY_CATEGORIES as GalleryCategory[],
    neighborhoodSpots: DEFAULT_NEIGHBORHOOD_SPOTS as NeighborhoodSpot[],
    specialOffers: DEFAULT_SPECIAL_OFFERS as SpecialOffer[],
  });

  // Background Cloud Sync Status Indicator
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(firestoreQuotaExhausted);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Diagnostics counters tracking user interactions and network calls
  const diagnosticsRef = useRef<SyncDiagnostics>({
    saveClicks: 0,
    cloudWritesAttempted: 0,
    cloudWritesSuccess: 0,
    cloudWritesFailed: 0,
    rateLimitHits: 0,
    activeRequests: 0,
    pendingQueueSize: 0,
    lastError: null,
    lastWriteTimestamp: null,
  });
  const [diagnostics, setDiagnostics] = useState<SyncDiagnostics>(diagnosticsRef.current);

  const clearQuotaFlag = () => {
    setIsQuotaExhausted(false);
    setLastSyncError(null);
    setCloudSyncStatus('idle');
  };

  // Track chunk counts in memory to eliminate sequential pre-write network reads
  const chunkCountsRef = useRef<Record<string, number>>({});
  const chunkHashesRef = useRef<Record<string, string>>({});

  // Track local save timestamps to prevent older server echoes from overwriting freshly written local data
  const lastLocalSaveTimeRef = useRef<Record<string, number>>({});

  // Coalescing Write Queue: Groups burst updates by section name
  const dirtySectionsRef = useRef<Set<string>>(new Set());
  const isWritingRef = useRef<boolean>(false);

  // Helper to persist current snapshot to high-capacity local cache (IndexedDB)
  const syncLocalCache = () => {
    saveLocalCache({
      propertyInfo: latestStateRef.current.propertyInfo,
      floorPlans: latestStateRef.current.floorPlans,
      amenities: latestStateRef.current.amenities,
      galleryItems: latestStateRef.current.galleryItems,
      galleryCategories: latestStateRef.current.galleryCategories,
      neighborhoodSpots: latestStateRef.current.neighborhoodSpots,
      specialOffers: latestStateRef.current.specialOffers,
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  };

  // High-performance batched chunked writer with ZERO PHANTOM DELETES
  const persistChunkedList = async <T,>(
    sectionName: string,
    items: T[]
  ): Promise<void> => {
    const timestamp = Date.now();
    syncLocalCache();

    try {
      // 1. Sanitize all items to eliminate undefined properties
      const cleanedItems = deepCleanForFirestore(items || []);

      // 2. Partition into safe chunks under 400KB each
      const chunks = partitionIntoSafeChunks(cleanedItems, 400000);

      const batch = writeBatch(db);
      const metaRef = doc(db, 'property_content', `${sectionName}_meta`);

      // 3. Stage chunk document writes with fingerprint diffing (only upload modified chunks)
      let stagedChunkCount = 0;
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunkHashKey = `${sectionName}_chunk_${idx}`;
        const newHash = computeFingerprint(chunks[idx]);
        if (chunkHashesRef.current[chunkHashKey] === newHash) {
          // Chunk is identical to cloud - skip re-uploading!
          continue;
        }
        const chunkRef = doc(db, 'property_content', chunkHashKey);
        batch.set(chunkRef, { items: chunks[idx], updatedAt: timestamp });
        chunkHashesRef.current[chunkHashKey] = newHash;
        stagedChunkCount++;
      }

      // 4. CRITICAL: ONLY delete excess old chunks if previous chunk count was strictly higher
      const prevChunkCount = chunkCountsRef.current[sectionName] || 0;
      let deletedCount = 0;
      if (prevChunkCount > chunks.length) {
        for (let idx = chunks.length; idx < prevChunkCount; idx++) {
          const excessRef = doc(db, 'property_content', `${sectionName}_chunk_${idx}`);
          batch.delete(excessRef);
          delete chunkHashesRef.current[`${sectionName}_chunk_${idx}`];
          deletedCount++;
        }
      }

      // If nothing was staged, no chunks deleted, and chunk counts match, skip network commit entirely!
      if (stagedChunkCount === 0 && deletedCount === 0 && prevChunkCount === chunks.length) {
        chunkCountsRef.current[sectionName] = chunks.length;
        return;
      }

      // 5. Update metadata manifest
      batch.set(metaRef, {
        totalItems: cleanedItems.length,
        chunkCount: chunks.length,
        updatedAt: timestamp,
      });

      // 6. Commit atomic write batch with realistic adaptive timeout based on volume
      const dynamicTimeoutMs = Math.max(35000, chunks.length * 6000);
      await withTimeout(batch.commit(), dynamicTimeoutMs, `Commit batch for ${sectionName}`);
      chunkCountsRef.current[sectionName] = chunks.length;
      console.log(`[PropertyData] Committed ${sectionName} to cloud (${cleanedItems.length} items, ${chunks.length} chunks)`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `property_content/${sectionName}_meta`);
      throw err;
    }
  };

  // Section writer that saves the latest coalesced state for a given section
  const writeSectionToCloud = async (sectionName: string): Promise<void> => {
    const timestamp = Date.now();

    if (sectionName === 'floor_plans') {
      await persistChunkedList('floor_plans', latestStateRef.current.floorPlans);
    } else if (sectionName === 'amenities') {
      await persistChunkedList('amenities', latestStateRef.current.amenities);
    } else if (sectionName === 'gallery') {
      await persistChunkedList('gallery', latestStateRef.current.galleryItems);
    } else if (sectionName === 'neighborhood') {
      await persistChunkedList('neighborhood', latestStateRef.current.neighborhoodSpots);
    } else if (sectionName === 'specials') {
      await persistChunkedList('specials', latestStateRef.current.specialOffers);
    } else if (sectionName === 'categories') {
      const catList = deepCleanForFirestore(latestStateRef.current.galleryCategories);
      const catHash = computeFingerprint(catList);
      if (chunkHashesRef.current['categories'] === catHash) {
        return;
      }
      try {
        await withTimeout(
          setDoc(doc(db, 'property_content', 'categories'), {
            list: catList,
            updatedAt: timestamp,
          }),
          35000,
          'Save categories'
        );
        chunkHashesRef.current['categories'] = catHash;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'property_content/categories');
        throw err;
      }
    } else if (sectionName === 'property_info') {
      const pInfo = latestStateRef.current.propertyInfo;
      const cleanedInfo = deepCleanForFirestore(pInfo);
      const imagesList = Array.isArray(cleanedInfo.images) ? cleanedInfo.images : [];
      if (imagesList.length > 0) {
        await persistChunkedList('property_images', imagesList);
      }
      const infoHash = computeFingerprint({ info: cleanedInfo, imageCount: imagesList.length });
      if (chunkHashesRef.current['property_info'] === infoHash) {
        return;
      }
      try {
        await withTimeout(
          setDoc(doc(db, 'property_content', 'property_info'), {
            data: { ...cleanedInfo, images: imagesList },
            updatedAt: timestamp,
          }),
          35000,
          'Save property_info'
        );
        chunkHashesRef.current['property_info'] = infoHash;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'property_content/property_info');
        throw err;
      }
    }
  };

  // Coalesced write processor: Drains dirty sections sequentially with token-bucket spacing
  const drainQueue = async (): Promise<void> => {
    if (isWritingRef.current) return;
    if (dirtySectionsRef.current.size === 0) {
      setCloudSyncStatus('saved');
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        setCloudSyncStatus('idle');
      }, 2500);
      return;
    }

    isWritingRef.current = true;
    setCloudSyncStatus('syncing');
    diagnosticsRef.current.activeRequests = 1;
    setDiagnostics({ ...diagnosticsRef.current });

    try {
      while (dirtySectionsRef.current.size > 0) {
        const nextSection = dirtySectionsRef.current.values().next().value;
        if (!nextSection) break;

        diagnosticsRef.current.cloudWritesAttempted++;
        setDiagnostics({ ...diagnosticsRef.current });

        try {
          await writeSectionToCloud(nextSection);
          dirtySectionsRef.current.delete(nextSection);
          diagnosticsRef.current.cloudWritesSuccess++;
          diagnosticsRef.current.lastWriteTimestamp = Date.now();
          diagnosticsRef.current.pendingQueueSize = dirtySectionsRef.current.size;
          setDiagnostics({ ...diagnosticsRef.current });

          // Safe 150ms spacing between writes to prevent token burst limits
          if (dirtySectionsRef.current.size > 0) {
            await new Promise((r) => setTimeout(r, 150));
          }
        } catch (err) {
          diagnosticsRef.current.cloudWritesFailed++;
          const errMsg = err instanceof Error ? err.message : String(err);
          diagnosticsRef.current.lastError = errMsg;
          setLastSyncError(errMsg);
          setCloudSyncStatus('error');
          setDiagnostics({ ...diagnosticsRef.current });
          console.error(`[PropertyData] Cloud write failed for ${nextSection}:`, errMsg);
          // Keep remaining dirty sections in queue so user can retry
          throw err;
        }
      }

      if (dirtySectionsRef.current.size === 0) {
        setCloudSyncStatus('saved');
        setLastSyncError(null);
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          setCloudSyncStatus('idle');
        }, 2500);
      }
    } finally {
      isWritingRef.current = false;
      diagnosticsRef.current.activeRequests = 0;
      diagnosticsRef.current.pendingQueueSize = dirtySectionsRef.current.size;
      setDiagnostics({ ...diagnosticsRef.current });
    }
  };

  // Enqueue a section for persistence and trigger coalescing queue drain
  const requestCloudSync = async (sectionName: string): Promise<void> => {
    dirtySectionsRef.current.add(sectionName);
    diagnosticsRef.current.saveClicks++;
    diagnosticsRef.current.pendingQueueSize = dirtySectionsRef.current.size;
    setDiagnostics({ ...diagnosticsRef.current });

    return drainQueue();
  };

  // Generic chunked read helper with fingerprint population
  const readChunkedList = async <T,>(
    sectionName: string,
    chunkCount: number
  ): Promise<T[]> => {
    if (chunkCount <= 0) return [];
    chunkCountsRef.current[sectionName] = chunkCount;
    try {
      const readTimeout = Math.max(15000, chunkCount * 2500);
      const chunkPromises = [];
      for (let i = 0; i < chunkCount; i++) {
        chunkPromises.push(
          withTimeout(
            getDoc(doc(db, 'property_content', `${sectionName}_chunk_${i}`)),
            readTimeout,
            `Read ${sectionName}_chunk_${i}`
          )
        );
      }
      const chunkSnaps = await Promise.all(chunkPromises);
      const loaded: T[] = [];
      chunkSnaps.forEach((snap, idx) => {
        if (snap.exists() && Array.isArray(snap.data()?.items)) {
          const chunkItems = snap.data()!.items;
          chunkHashesRef.current[`${sectionName}_chunk_${idx}`] = computeFingerprint(chunkItems);
          loaded.push(...chunkItems);
        }
      });
      return loaded;
    } catch (err) {
      console.warn(`[PropertyData] Error reading chunked list for ${sectionName}:`, err);
      return [];
    }
  };

  // Track whether authoritative cloud data has already been received per section
  const hasReceivedCloudDataRef = useRef<Record<string, boolean>>({});

  // 1. Instant initial load from local cache on cold startup, never clobbering incoming cloud data
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cached = await getLocalCache();
        if (cached && isMounted) {
          if (cached.propertyInfo && !hasReceivedCloudDataRef.current['property_info']) {
            const pInfo = { ...cached.propertyInfo };
            if (!pInfo.videoTourUrl || pInfo.videoTourUrl.includes('ForBiggerBlazes') || pInfo.videoTourUrl.includes('gtv-videos-bucket')) {
              pInfo.videoTourUrl = 'https://youtu.be/7IS64iZvKpg';
            }
            setPropertyInfo(pInfo);
            latestStateRef.current.propertyInfo = pInfo;
            chunkHashesRef.current['property_info'] = computeFingerprint({ info: pInfo, imageCount: (pInfo.images || []).length });
          }
          if (Array.isArray(cached.floorPlans) && cached.floorPlans.length > 0 && !hasReceivedCloudDataRef.current['floor_plans']) {
            setFloorPlans(cached.floorPlans);
            latestStateRef.current.floorPlans = cached.floorPlans;
          }
          if (Array.isArray(cached.amenities) && cached.amenities.length > 0 && !hasReceivedCloudDataRef.current['amenities']) {
            setAmenities(cached.amenities);
            latestStateRef.current.amenities = cached.amenities;
          }
          if (Array.isArray(cached.galleryItems) && cached.galleryItems.length > 0 && !hasReceivedCloudDataRef.current['gallery']) {
            setGalleryItems(cached.galleryItems);
            latestStateRef.current.galleryItems = cached.galleryItems;
          }
          if (Array.isArray(cached.galleryCategories) && cached.galleryCategories.length > 0 && !hasReceivedCloudDataRef.current['categories']) {
            setGalleryCategories(cached.galleryCategories);
            latestStateRef.current.galleryCategories = cached.galleryCategories;
            chunkHashesRef.current['categories'] = computeFingerprint(cached.galleryCategories);
          }
          if (Array.isArray(cached.neighborhoodSpots) && cached.neighborhoodSpots.length > 0 && !hasReceivedCloudDataRef.current['neighborhood']) {
            setNeighborhoodSpots(cached.neighborhoodSpots);
            latestStateRef.current.neighborhoodSpots = cached.neighborhoodSpots;
          }
          if (Array.isArray(cached.specialOffers) && cached.specialOffers.length > 0 && !hasReceivedCloudDataRef.current['specials']) {
            setSpecialOffers(cached.specialOffers);
            latestStateRef.current.specialOffers = cached.specialOffers;
          }
        }
      } catch (err) {
        console.warn('Could not load local cached data:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real-time Firestore synchronizers across all sections with independent chunked architecture
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Helper to setup a chunked sync listener with legacy single-doc fallback
    const setupChunkedSync = <T,>(
      sectionName: string,
      setter: (val: T[]) => void,
      stateField: keyof typeof latestStateRef.current
    ) => {
      let metaLoaded = false;
      const metaRef = doc(db, 'property_content', `${sectionName}_meta`);
      const unsubMeta = onSnapshot(
        metaRef,
        async (docSnap) => {
          if (docSnap.metadata.hasPendingWrites) return;
          if (docSnap.exists()) {
            metaLoaded = true;
            const data = docSnap.data();
            const chunkCount = Number(data?.chunkCount) || 0;
            const loaded = await readChunkedList<T>(sectionName, chunkCount);
            if (loaded.length > 0 || chunkCount === 0) {
              hasReceivedCloudDataRef.current[sectionName] = true;
              setter(loaded);
              (latestStateRef.current as any)[stateField] = loaded;
              syncLocalCache();
            }
          } else {
            // Fallback: Check if unchunked legacy document exists
            if (!metaLoaded) {
              try {
                const legacySnap = await getDoc(doc(db, 'property_content', sectionName));
                if (legacySnap.exists()) {
                  const legData = legacySnap.data();
                  if (Array.isArray(legData?.list) && legData.list.length > 0) {
                    hasReceivedCloudDataRef.current[sectionName] = true;
                    setter(legData.list);
                    (latestStateRef.current as any)[stateField] = legData.list;
                    syncLocalCache();
                  }
                }
              } catch {
                // ignore
              }
            }
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `property_content/${sectionName}_meta`)
      );
      unsubscribers.push(unsubMeta);
    };

    // --- Gallery Photos Sync ---
    setupChunkedSync<GalleryItem>(
      'gallery',
      setGalleryItems,
      'galleryItems'
    );

    // --- Floor Plans Sync ---
    setupChunkedSync<FloorPlan>(
      'floor_plans',
      setFloorPlans,
      'floorPlans'
    );

    // --- Amenities Sync ---
    setupChunkedSync<Amenity>(
      'amenities',
      setAmenities,
      'amenities'
    );

    // --- Neighborhood Spots Sync ---
    setupChunkedSync<NeighborhoodSpot>(
      'neighborhood',
      setNeighborhoodSpots,
      'neighborhoodSpots'
    );

    // --- Coupons / Special Offers Sync ---
    setupChunkedSync<SpecialOffer>(
      'specials',
      setSpecialOffers,
      'specialOffers'
    );

    // --- Gallery Categories Sync ---
    const categoriesDocRef = doc(db, 'property_content', 'categories');
    const unsubCategories = onSnapshot(
      categoriesDocRef,
      (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.list)) {
            hasReceivedCloudDataRef.current['categories'] = true;
            setGalleryCategories(data.list);
            latestStateRef.current.galleryCategories = data.list;
            chunkHashesRef.current['categories'] = computeFingerprint(data.list);
            syncLocalCache();
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'property_content/categories')
    );
    unsubscribers.push(unsubCategories);

    // --- Property Info Sync ---
    const infoDocRef = doc(db, 'property_content', 'property_info');
    const unsubInfo = onSnapshot(
      infoDocRef,
      async (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.data) {
            hasReceivedCloudDataRef.current['property_info'] = true;
            let combinedInfo: PropertyInfo = { ...data.data };
            if (!combinedInfo.videoTourUrl || combinedInfo.videoTourUrl.includes('ForBiggerBlazes') || combinedInfo.videoTourUrl.includes('gtv-videos-bucket')) {
              combinedInfo.videoTourUrl = 'https://youtu.be/7IS64iZvKpg';
            }
            // Hydrate chunked property images if present
            try {
              const pImgMetaSnap = await getDoc(doc(db, 'property_content', 'property_images_meta'));
              if (pImgMetaSnap.exists()) {
                const count = Number(pImgMetaSnap.data()?.chunkCount) || 0;
                const chunkedImages = await readChunkedList<string>('property_images', count);
                if (chunkedImages.length > 0) {
                  combinedInfo.images = chunkedImages;
                }
              }
            } catch {
              // ignore
            }
            setPropertyInfo(combinedInfo);
            latestStateRef.current.propertyInfo = combinedInfo;
            chunkHashesRef.current['property_info'] = computeFingerprint({ info: combinedInfo, imageCount: (combinedInfo.images || []).length });
            syncLocalCache();
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'property_content/property_info')
    );
    unsubscribers.push(unsubInfo);

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, []);

  // --- Bulk Persistence Methods (Optimistic UI: Updates state instantly, returns Promise that commits to cloud) ---

  const saveFloorPlans = async (plans: FloorPlan[]): Promise<void> => {
    latestStateRef.current.floorPlans = plans;
    lastLocalSaveTimeRef.current['floor_plans'] = Date.now();
    setFloorPlans(plans);
    syncLocalCache();
    return requestCloudSync('floor_plans');
  };

  const saveAmenities = async (amenitiesList: Amenity[]): Promise<void> => {
    latestStateRef.current.amenities = amenitiesList;
    lastLocalSaveTimeRef.current['amenities'] = Date.now();
    setAmenities(amenitiesList);
    syncLocalCache();
    return requestCloudSync('amenities');
  };

  const saveGalleryItems = async (items: GalleryItem[]): Promise<void> => {
    latestStateRef.current.galleryItems = items;
    lastLocalSaveTimeRef.current['gallery'] = Date.now();
    setGalleryItems(items);
    syncLocalCache();
    return requestCloudSync('gallery');
  };

  const saveNeighborhoodSpots = async (spots: NeighborhoodSpot[]): Promise<void> => {
    latestStateRef.current.neighborhoodSpots = spots;
    lastLocalSaveTimeRef.current['neighborhood'] = Date.now();
    setNeighborhoodSpots(spots);
    syncLocalCache();
    return requestCloudSync('neighborhood');
  };

  const saveSpecialOffers = async (offers: SpecialOffer[]): Promise<void> => {
    latestStateRef.current.specialOffers = offers;
    lastLocalSaveTimeRef.current['specials'] = Date.now();
    setSpecialOffers(offers);
    syncLocalCache();
    return requestCloudSync('specials');
  };

  const savePropertyInfo = async (info: PropertyInfo): Promise<void> => {
    latestStateRef.current.propertyInfo = info;
    const nowTime = Date.now();
    lastLocalSaveTimeRef.current['info'] = nowTime;
    lastLocalSaveTimeRef.current['property_images'] = nowTime;
    setPropertyInfo(info);
    syncLocalCache();
    return requestCloudSync('property_info');
  };

  // --- Floor Plans Item Handlers ---
  const addFloorPlan = async (plan: FloorPlan): Promise<void> => {
    const cleaned = deepCleanForFirestore(plan);
    const updated = [cleaned, ...latestStateRef.current.floorPlans];
    return saveFloorPlans(updated);
  };

  const updateFloorPlan = async (id: string, partial: Partial<FloorPlan>): Promise<void> => {
    const existing = latestStateRef.current.floorPlans.find((p) => p.id === id);
    if (!existing) {
      console.warn(`[PropertyData] Floor plan ${id} not found to update`);
      return;
    }

    // Strip undefined keys from partial so they never overwrite existing values
    const cleanPartial: Partial<FloorPlan> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) {
        (cleanPartial as any)[k] = v;
      }
    }

    // Merge existing database record + admin changes = complete updated record
    const resolvedImages = cleanPartial.images !== undefined 
      ? cleanPartial.images 
      : (existing.images || []);

    const resolvedImageUrl = cleanPartial.imageUrl !== undefined
      ? cleanPartial.imageUrl
      : (resolvedImages.length > 0 ? resolvedImages[0] : (existing.imageUrl || ''));

    const mergedPlan: FloorPlan = {
      ...existing,
      ...cleanPartial,
      name: cleanPartial.name !== undefined ? cleanPartial.name : existing.name,
      code: cleanPartial.code !== undefined ? cleanPartial.code : (existing.code || ''),
      description: cleanPartial.description !== undefined ? cleanPartial.description : existing.description,
      bedrooms: cleanPartial.bedrooms !== undefined ? cleanPartial.bedrooms : existing.bedrooms,
      bathrooms: cleanPartial.bathrooms !== undefined ? cleanPartial.bathrooms : existing.bathrooms,
      sqft: cleanPartial.sqft !== undefined ? cleanPartial.sqft : existing.sqft,
      startingPrice: cleanPartial.startingPrice !== undefined ? cleanPartial.startingPrice : existing.startingPrice,
      deposit: cleanPartial.deposit !== undefined ? cleanPartial.deposit : existing.deposit,
      availableCount: cleanPartial.availableCount !== undefined ? cleanPartial.availableCount : existing.availableCount,
      popular: cleanPartial.popular !== undefined ? cleanPartial.popular : existing.popular,
      features: cleanPartial.features !== undefined ? cleanPartial.features : (existing.features || []),
      dimensions: cleanPartial.dimensions !== undefined ? {
        ...(existing.dimensions || {}),
        ...cleanPartial.dimensions,
      } : (existing.dimensions || {}),
      images: resolvedImages,
      imageUrl: resolvedImageUrl,
    };

    const updated = latestStateRef.current.floorPlans.map((p) =>
      p.id === id ? mergedPlan : p
    );
    return saveFloorPlans(updated);
  };

  const deleteFloorPlan = async (id: string): Promise<void> => {
    const updated = latestStateRef.current.floorPlans.filter((p) => p.id !== id);
    return saveFloorPlans(updated);
  };

  // --- Gallery Photos Handlers ---
  const addGalleryPhoto = async (photo: GalleryItem): Promise<void> => {
    const cleaned = deepCleanForFirestore(photo);
    const updated = [cleaned, ...latestStateRef.current.galleryItems];
    return saveGalleryItems(updated);
  };

  // Bulk upload (20, 30, 50, 100 images in one operation)
  const addGalleryPhotosBatch = async (newPhotos: GalleryItem[]): Promise<void> => {
    const cleaned = deepCleanForFirestore(newPhotos);
    const updated = [...cleaned, ...latestStateRef.current.galleryItems];
    return saveGalleryItems(updated);
  };

  const updateGalleryPhoto = async (id: string, partial: Partial<GalleryItem>): Promise<void> => {
    const existing = latestStateRef.current.galleryItems.find((g) => g.id === id);
    if (!existing) return;

    const cleanPartial: Partial<GalleryItem> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) {
        (cleanPartial as any)[k] = v;
      }
    }

    const merged: GalleryItem = {
      ...existing,
      ...cleanPartial,
    };

    const updated = latestStateRef.current.galleryItems.map((g) =>
      g.id === id ? merged : g
    );
    return saveGalleryItems(updated);
  };

  const deleteGalleryPhoto = async (id: string): Promise<void> => {
    const updated = latestStateRef.current.galleryItems.filter((g) => g.id !== id);
    return saveGalleryItems(updated);
  };

  const reorderGalleryPhotos = async (items: GalleryItem[]): Promise<void> => {
    return saveGalleryItems(items);
  };

  // --- Gallery Categories Handlers ---
  const addGalleryCategory = async (label: string): Promise<void> => {
    const cleanLabel = label.trim();
    if (!cleanLabel) return;
    const cleanId = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (
      latestStateRef.current.galleryCategories.some(
        (c) => c.id === cleanId || c.label.toLowerCase() === cleanLabel.toLowerCase()
      )
    ) {
      return;
    }
    const updated = [...latestStateRef.current.galleryCategories, { id: cleanId, label: cleanLabel }];
    latestStateRef.current.galleryCategories = updated;
    lastLocalSaveTimeRef.current['categories'] = Date.now();
    setGalleryCategories(updated);
    syncLocalCache();
    return requestCloudSync('categories');
  };

  const removeGalleryCategory = async (id: string): Promise<void> => {
    if (id === 'all') return;
    const updated = latestStateRef.current.galleryCategories.filter((c) => c.id !== id);
    latestStateRef.current.galleryCategories = updated;
    lastLocalSaveTimeRef.current['categories'] = Date.now();
    setGalleryCategories(updated);
    syncLocalCache();
    return requestCloudSync('categories');
  };

  // --- Amenities Handlers ---
  const addAmenity = async (amenity: Amenity): Promise<void> => {
    const cleaned = deepCleanForFirestore(amenity);
    const updated = [cleaned, ...latestStateRef.current.amenities];
    return saveAmenities(updated);
  };

  const updateAmenity = async (id: string, partial: Partial<Amenity>): Promise<void> => {
    const existing = latestStateRef.current.amenities.find((a) => a.id === id);
    if (!existing) return;

    const cleanPartial: Partial<Amenity> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) {
        (cleanPartial as any)[k] = v;
      }
    }

    const resolvedImages = cleanPartial.images !== undefined 
      ? cleanPartial.images 
      : (existing.images || []);

    const resolvedImage = cleanPartial.image !== undefined
      ? cleanPartial.image
      : (resolvedImages.length > 0 ? resolvedImages[0] : (existing.image || ''));

    const merged: Amenity = {
      ...existing,
      ...cleanPartial,
      title: cleanPartial.title !== undefined ? cleanPartial.title : existing.title,
      description: cleanPartial.description !== undefined ? cleanPartial.description : existing.description,
      category: cleanPartial.category !== undefined ? cleanPartial.category : existing.category,
      icon: cleanPartial.icon !== undefined ? cleanPartial.icon : existing.icon,
      highlight: cleanPartial.highlight !== undefined ? cleanPartial.highlight : existing.highlight,
      images: resolvedImages,
      image: resolvedImage,
    };

    const updated = latestStateRef.current.amenities.map((a) =>
      a.id === id ? merged : a
    );
    return saveAmenities(updated);
  };

  const deleteAmenity = async (id: string): Promise<void> => {
    const updated = latestStateRef.current.amenities.filter((a) => a.id !== id);
    return saveAmenities(updated);
  };

  // --- Neighborhood Handlers ---
  const addNeighborhoodSpot = async (spot: NeighborhoodSpot): Promise<void> => {
    const cleaned = deepCleanForFirestore(spot);
    const updated = [cleaned, ...latestStateRef.current.neighborhoodSpots];
    return saveNeighborhoodSpots(updated);
  };

  const updateNeighborhoodSpot = async (id: string, partial: Partial<NeighborhoodSpot>): Promise<void> => {
    const existing = latestStateRef.current.neighborhoodSpots.find((s) => s.id === id);
    if (!existing) return;

    const cleanPartial: Partial<NeighborhoodSpot> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) {
        (cleanPartial as any)[k] = v;
      }
    }

    const resolvedImages = cleanPartial.images !== undefined 
      ? cleanPartial.images 
      : (existing.images || []);

    const resolvedImage = cleanPartial.image !== undefined
      ? cleanPartial.image
      : (resolvedImages.length > 0 ? resolvedImages[0] : (existing.image || ''));

    const merged: NeighborhoodSpot = {
      ...existing,
      ...cleanPartial,
      name: cleanPartial.name !== undefined ? cleanPartial.name : existing.name,
      category: cleanPartial.category !== undefined ? cleanPartial.category : existing.category,
      distance: cleanPartial.distance !== undefined ? cleanPartial.distance : existing.distance,
      timeDrive: cleanPartial.timeDrive !== undefined ? cleanPartial.timeDrive : existing.timeDrive,
      address: cleanPartial.address !== undefined ? cleanPartial.address : (existing.address || ''),
      description: cleanPartial.description !== undefined ? cleanPartial.description : existing.description,
      images: resolvedImages,
      image: resolvedImage,
    };

    const updated = latestStateRef.current.neighborhoodSpots.map((s) =>
      s.id === id ? merged : s
    );
    return saveNeighborhoodSpots(updated);
  };

  const deleteNeighborhoodSpot = async (id: string): Promise<void> => {
    const updated = latestStateRef.current.neighborhoodSpots.filter((s) => s.id !== id);
    return saveNeighborhoodSpots(updated);
  };

  // --- Property Info Handlers ---
  const updatePropertyInfo = async (partial: Partial<PropertyInfo>): Promise<void> => {
    const existing = latestStateRef.current.propertyInfo;
    const cleanPartial: Partial<PropertyInfo> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) {
        (cleanPartial as any)[k] = v;
      }
    }

    const merged: PropertyInfo = {
      ...existing,
      ...cleanPartial,
      hours: cleanPartial.hours !== undefined ? cleanPartial.hours : existing.hours,
      petPolicy: {
        ...(existing.petPolicy || {
          allowed: 'Dogs and Cats Allowed',
          maxPets: 2,
          maxWeight: '75 lbs',
          monthlyRent: '$35/month',
          highlight: 'Pet friendly with dog park nearby'
        }),
        ...(cleanPartial.petPolicy || {})
      },
      images: cleanPartial.images !== undefined ? cleanPartial.images : (existing.images || []),
    };

    return savePropertyInfo(merged);
  };

  // --- Special Offers / Coupons Handlers ---
  const addSpecialOffer = async (offer: SpecialOffer): Promise<void> => {
    const cleaned = deepCleanForFirestore(offer);
    const updated = [cleaned, ...latestStateRef.current.specialOffers];
    return saveSpecialOffers(updated);
  };

  const updateSpecialOffer = async (id: string, partial: Partial<SpecialOffer>): Promise<void> => {
    const existing = latestStateRef.current.specialOffers.find((o) => o.id === id);
    if (!existing) return;

    const cleanPartial: Partial<SpecialOffer> = {};
    for (const [k, v] of Object.entries(partial)) {
      if (v !== undefined) {
        (cleanPartial as any)[k] = v;
      }
    }

    const resolvedImages = cleanPartial.images !== undefined 
      ? cleanPartial.images 
      : (existing.images || []);

    const resolvedImage = cleanPartial.image !== undefined
      ? cleanPartial.image
      : (resolvedImages.length > 0 ? resolvedImages[0] : (existing.image || ''));

    const merged: SpecialOffer = {
      ...existing,
      ...cleanPartial,
      title: cleanPartial.title !== undefined ? cleanPartial.title : existing.title,
      highlightCode: cleanPartial.highlightCode !== undefined ? cleanPartial.highlightCode : (existing.highlightCode || ''),
      badge: cleanPartial.badge !== undefined ? cleanPartial.badge : existing.badge,
      discountType: cleanPartial.discountType !== undefined ? cleanPartial.discountType : existing.discountType,
      discountValue: cleanPartial.discountValue !== undefined ? cleanPartial.discountValue : existing.discountValue,
      expiresDate: cleanPartial.expiresDate !== undefined ? cleanPartial.expiresDate : existing.expiresDate,
      terms: cleanPartial.terms !== undefined ? cleanPartial.terms : existing.terms,
      description: cleanPartial.description !== undefined ? cleanPartial.description : existing.description,
      images: resolvedImages,
      image: resolvedImage,
    };

    const updated = latestStateRef.current.specialOffers.map((o) =>
      o.id === id ? merged : o
    );
    return saveSpecialOffers(updated);
  };

  const deleteSpecialOffer = async (id: string): Promise<void> => {
    const updated = latestStateRef.current.specialOffers.filter((o) => o.id !== id);
    return saveSpecialOffers(updated);
  };

  const resetToDefaults = async (): Promise<void> => {
    latestStateRef.current = {
      propertyInfo: DEFAULT_PROPERTY_INFO,
      floorPlans: DEFAULT_FLOOR_PLANS,
      amenities: DEFAULT_AMENITIES,
      galleryItems: DEFAULT_GALLERY_ITEMS,
      galleryCategories: DEFAULT_GALLERY_CATEGORIES,
      neighborhoodSpots: DEFAULT_NEIGHBORHOOD_SPOTS,
      specialOffers: DEFAULT_SPECIAL_OFFERS,
    };
    setPropertyInfo(DEFAULT_PROPERTY_INFO);
    setFloorPlans(DEFAULT_FLOOR_PLANS);
    setAmenities(DEFAULT_AMENITIES);
    setGalleryItems(DEFAULT_GALLERY_ITEMS);
    setGalleryCategories(DEFAULT_GALLERY_CATEGORIES);
    setNeighborhoodSpots(DEFAULT_NEIGHBORHOOD_SPOTS);
    setSpecialOffers(DEFAULT_SPECIAL_OFFERS);
    syncLocalCache();

    await Promise.all([
      saveFloorPlans(DEFAULT_FLOOR_PLANS),
      saveAmenities(DEFAULT_AMENITIES),
      saveGalleryItems(DEFAULT_GALLERY_ITEMS),
      saveNeighborhoodSpots(DEFAULT_NEIGHBORHOOD_SPOTS),
      saveSpecialOffers(DEFAULT_SPECIAL_OFFERS),
      savePropertyInfo(DEFAULT_PROPERTY_INFO),
    ]);
  };

  const forceSyncToCloud = async (resetQuotaCheck = false): Promise<{ success: boolean; message?: string } | void> => {
    if (resetQuotaCheck) {
      setIsQuotaExhausted(false);
    }
    // Clear chunk hashes so all sections are guaranteed to re-evaluate and write
    chunkHashesRef.current = {};
    ['floor_plans', 'amenities', 'gallery', 'neighborhood', 'specials', 'categories', 'property_info'].forEach((s) => {
      dirtySectionsRef.current.add(s);
    });
    diagnosticsRef.current.saveClicks++;
    diagnosticsRef.current.pendingQueueSize = dirtySectionsRef.current.size;
    setDiagnostics({ ...diagnosticsRef.current });
    try {
      await drainQueue();
      return { success: true, message: 'All property data successfully synced to cloud!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Sync failed. Please check network or permissions.' };
    }
  };

  const refreshFromCloud = async (): Promise<void> => {
    setCloudSyncStatus('syncing');
    try {
      lastLocalSaveTimeRef.current = {};

      const [galleryMeta, plansMeta, amenitiesMeta, neighMeta, specialsMeta, catSnap, infoSnap] = await Promise.all([
        getDoc(doc(db, 'property_content', 'gallery_meta')).catch(() => null),
        getDoc(doc(db, 'property_content', 'floor_plans_meta')).catch(() => null),
        getDoc(doc(db, 'property_content', 'amenities_meta')).catch(() => null),
        getDoc(doc(db, 'property_content', 'neighborhood_meta')).catch(() => null),
        getDoc(doc(db, 'property_content', 'specials_meta')).catch(() => null),
        getDoc(doc(db, 'property_content', 'categories')).catch(() => null),
        getDoc(doc(db, 'property_content', 'property_info')).catch(() => null),
      ]);

      if (plansMeta && plansMeta.exists()) {
        const count = Number(plansMeta.data()?.chunkCount) || 0;
        const loaded = await readChunkedList<FloorPlan>('floor_plans', count);
        if (loaded.length > 0 || count === 0) {
          hasReceivedCloudDataRef.current['floor_plans'] = true;
          setFloorPlans(loaded);
          latestStateRef.current.floorPlans = loaded;
        }
      }

      if (galleryMeta && galleryMeta.exists()) {
        const count = Number(galleryMeta.data()?.chunkCount) || 0;
        const loaded = await readChunkedList<GalleryItem>('gallery', count);
        if (loaded.length > 0 || count === 0) {
          hasReceivedCloudDataRef.current['gallery'] = true;
          setGalleryItems(loaded);
          latestStateRef.current.galleryItems = loaded;
        }
      }

      if (amenitiesMeta && amenitiesMeta.exists()) {
        const count = Number(amenitiesMeta.data()?.chunkCount) || 0;
        const loaded = await readChunkedList<Amenity>('amenities', count);
        if (loaded.length > 0 || count === 0) {
          hasReceivedCloudDataRef.current['amenities'] = true;
          setAmenities(loaded);
          latestStateRef.current.amenities = loaded;
        }
      }

      if (neighMeta && neighMeta.exists()) {
        const count = Number(neighMeta.data()?.chunkCount) || 0;
        const loaded = await readChunkedList<NeighborhoodSpot>('neighborhood', count);
        if (loaded.length > 0 || count === 0) {
          hasReceivedCloudDataRef.current['neighborhood'] = true;
          setNeighborhoodSpots(loaded);
          latestStateRef.current.neighborhoodSpots = loaded;
        }
      }

      if (specialsMeta && specialsMeta.exists()) {
        const count = Number(specialsMeta.data()?.chunkCount) || 0;
        const loaded = await readChunkedList<SpecialOffer>('specials', count);
        if (loaded.length > 0 || count === 0) {
          hasReceivedCloudDataRef.current['specials'] = true;
          setSpecialOffers(loaded);
          latestStateRef.current.specialOffers = loaded;
        }
      }

      if (catSnap && catSnap.exists() && Array.isArray(catSnap.data()?.list)) {
        hasReceivedCloudDataRef.current['categories'] = true;
        setGalleryCategories(catSnap.data()!.list);
        latestStateRef.current.galleryCategories = catSnap.data()!.list;
      }

      if (infoSnap && infoSnap.exists() && infoSnap.data()?.data) {
        const pInfo = { ...infoSnap.data()!.data };
        try {
          const pImgMetaSnap = await getDoc(doc(db, 'property_content', 'property_images_meta')).catch(() => null);
          if (pImgMetaSnap && pImgMetaSnap.exists()) {
            const count = Number(pImgMetaSnap.data()?.chunkCount) || 0;
            if (count > 0) {
              const chunkedImages = await readChunkedList<string>('property_images', count);
              if (Array.isArray(chunkedImages) && chunkedImages.length > 0) {
                pInfo.images = chunkedImages;
              }
            }
          }
        } catch {
          // ignore
        }
        hasReceivedCloudDataRef.current['property_info'] = true;
        setPropertyInfo(pInfo);
        latestStateRef.current.propertyInfo = pInfo;
      }

      syncLocalCache();
      setCloudSyncStatus('saved');
      setLastSyncError(null);
      setTimeout(() => setCloudSyncStatus('idle'), 2000);
    } catch (err: any) {
      console.error('[PropertyData] Error refreshing from cloud:', err);
      setCloudSyncStatus('error');
      setLastSyncError(err?.message || 'Failed to refresh from cloud');
      setTimeout(() => setCloudSyncStatus('idle'), 3000);
    }
  };

  const submitEnquiry = async (data: {
    customerName: string;
    phone: string;
    email?: string;
    enquiryType: 'Tour Request' | 'Quick Message' | 'General Enquiry';
    service?: string;
    preferredDate?: string;
    preferredTime?: string;
    floorPlanInterest?: string;
    message?: string;
    location?: string;
    additionalDetails?: Record<string, string>;
  }): Promise<{ success: boolean; enquiry: Enquiry; emailStatus: EmailDeliveryStatus; emailError?: string }> => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = `ENQ-${datePart}-${randomPart}`;

    const targetRecipient =
      propertyInfo?.email && propertyInfo.email.includes('@') && propertyInfo.email !== 'aibrandorigin@gmail.com'
        ? propertyInfo.email.trim()
        : DEFAULT_PROPERTY_INFO.email || 'ellisonsolon@gmail.com';

    const newEnquiry: Enquiry = {
      id,
      createdAt: now.toISOString(),
      customerName: data.customerName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      enquiryType: data.enquiryType,
      service: data.service,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      floorPlanInterest: data.floorPlanInterest,
      message: data.message?.trim(),
      location: data.location || 'The Ellis on Solon (Waxahachie, TX)',
      status: 'new',
      emailStatus: 'pending',
      emailRecipient: targetRecipient,
      emailAttempts: 0,
      additionalDetails: data.additionalDetails,
    };

    // 1. Instantly save to local state and cache so enquiry is NEVER lost
    setEnquiries((prev) => [newEnquiry, ...prev.filter((e) => e.id !== id)]);
    try {
      const current = JSON.parse(localStorage.getItem('ellis_cached_enquiries') || '[]');
      localStorage.setItem('ellis_cached_enquiries', JSON.stringify([newEnquiry, ...current.filter((e: any) => e.id !== id)]));
    } catch {}

    // 2. Persist to Firestore database
    try {
      await setDoc(doc(db, 'enquiries', id), deepCleanForFirestore(newEnquiry));
    } catch (dbErr) {
      console.warn('[PropertyData] Direct Firestore write cached:', dbErr);
    }

    // 3. Dispatch server-side email notification to configured property email
    let emailStatus: EmailDeliveryStatus = 'pending';
    let emailError: string | null = null;
    let emailSentAt: string | null = null;

    try {
      const response = await fetch('/api/send-enquiry-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiry: newEnquiry }),
      });
      const result = await response.json();

      if (response.ok && result.success && result.status === 'sent') {
        emailStatus = 'sent';
        emailSentAt = result.timestamp || new Date().toISOString();
      } else {
        emailStatus = 'failed';
        emailError = result.error || 'Email notification delivery failed';
      }
    } catch (err: unknown) {
      emailStatus = 'failed';
      emailError = err instanceof Error ? err.message : String(err);
    }

    // 4. Update enquiry record with final email delivery result
    const updatedEnquiry: Enquiry = {
      ...newEnquiry,
      emailStatus,
      emailError,
      emailSentAt,
      emailAttempts: 1,
    };

    setEnquiries((prev) => [updatedEnquiry, ...prev.filter((e) => e.id !== id)]);
    try {
      await setDoc(doc(db, 'enquiries', id), deepCleanForFirestore(updatedEnquiry));
      const current = JSON.parse(localStorage.getItem('ellis_cached_enquiries') || '[]');
      localStorage.setItem('ellis_cached_enquiries', JSON.stringify([updatedEnquiry, ...current.filter((e: any) => e.id !== id)]));
    } catch {}

    return {
      success: true,
      enquiry: updatedEnquiry,
      emailStatus,
      emailError: emailError || undefined,
    };
  };

  const retryEnquiryEmail = async (enquiryId: string): Promise<{ success: boolean; emailStatus: EmailDeliveryStatus; emailError?: string }> => {
    const existing = enquiries.find((e) => e.id === enquiryId);
    if (!existing) {
      return { success: false, emailStatus: 'failed', emailError: 'Enquiry record not found' };
    }

    const targetRecipient =
      propertyInfo?.email && propertyInfo.email.includes('@') && propertyInfo.email !== 'aibrandorigin@gmail.com'
        ? propertyInfo.email.trim()
        : existing.emailRecipient && existing.emailRecipient !== 'aibrandorigin@gmail.com'
        ? existing.emailRecipient
        : DEFAULT_PROPERTY_INFO.email || 'ellisonsolon@gmail.com';

    const enquiryForRetry: Enquiry = {
      ...existing,
      emailRecipient: targetRecipient,
    };

    const nextAttempts = (existing.emailAttempts || 0) + 1;
    let newStatus: EmailDeliveryStatus = 'pending';
    let newError: string | null = null;
    let newSentAt: string | null = existing.emailSentAt || null;

    try {
      const response = await fetch('/api/send-enquiry-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiry: enquiryForRetry, isRetry: true }),
      });
      const result = await response.json();

      if (response.ok && result.success && result.status === 'sent') {
        newStatus = 'sent';
        newSentAt = result.timestamp || new Date().toISOString();
        newError = null;
      } else {
        newStatus = 'failed';
        newError = result.error || 'Retry delivery failed';
      }
    } catch (err: unknown) {
      newStatus = 'failed';
      newError = err instanceof Error ? err.message : String(err);
    }

    const updated: Enquiry = {
      ...enquiryForRetry,
      emailStatus: newStatus,
      emailError: newError,
      emailSentAt: newSentAt,
      emailAttempts: nextAttempts,
    };

    setEnquiries((prev) => prev.map((e) => (e.id === enquiryId ? updated : e)));
    try {
      await setDoc(doc(db, 'enquiries', enquiryId), deepCleanForFirestore(updated));
      const current = JSON.parse(localStorage.getItem('ellis_cached_enquiries') || '[]');
      localStorage.setItem('ellis_cached_enquiries', JSON.stringify(current.map((e: any) => (e.id === enquiryId ? updated : e))));
    } catch {}

    return {
      success: newStatus === 'sent',
      emailStatus: newStatus,
      emailError: newError || undefined,
    };
  };

  const updateEnquiryStatus = async (enquiryId: string, status: Enquiry['status']): Promise<void> => {
    setEnquiries((prev) => prev.map((e) => (e.id === enquiryId ? { ...e, status } : e)));
    try {
      await setDoc(doc(db, 'enquiries', enquiryId), { status }, { merge: true });
    } catch {}
  };

  const deleteEnquiry = async (enquiryId: string): Promise<void> => {
    setEnquiries((prev) => prev.filter((e) => e.id !== enquiryId));
    try {
      await deleteDoc(doc(db, 'enquiries', enquiryId));
      const current = JSON.parse(localStorage.getItem('ellis_cached_enquiries') || '[]');
      localStorage.setItem('ellis_cached_enquiries', JSON.stringify(current.filter((e: any) => e.id !== enquiryId)));
    } catch {}
  };

  return (
    <PropertyDataContext.Provider
      value={{
        propertyInfo,
        floorPlans,
        amenities,
        galleryItems,
        galleryCategories,
        neighborhoodSpots,
        specialOffers,
        saveFloorPlans,
        saveAmenities,
        saveGalleryItems,
        saveNeighborhoodSpots,
        saveSpecialOffers,
        savePropertyInfo,
        addFloorPlan,
        updateFloorPlan,
        deleteFloorPlan,
        addGalleryPhoto,
        addGalleryPhotosBatch,
        updateGalleryPhoto,
        deleteGalleryPhoto,
        reorderGalleryPhotos,
        addGalleryCategory,
        removeGalleryCategory,
        addAmenity,
        updateAmenity,
        deleteAmenity,
        addNeighborhoodSpot,
        updateNeighborhoodSpot,
        deleteNeighborhoodSpot,
        updatePropertyInfo,
        addSpecialOffer,
        updateSpecialOffer,
        deleteSpecialOffer,
        cloudSyncStatus,
        lastSyncError,
        isQuotaExhausted,
        clearQuotaFlag,
        forceSyncToCloud,
        refreshFromCloud,
        resetToDefaults,
        diagnostics,
        enquiries,
        submitEnquiry,
        retryEnquiryEmail,
        updateEnquiryStatus,
        deleteEnquiry,
      }}
    >
      {children}
    </PropertyDataContext.Provider>
  );
};

export const usePropertyData = () => {
  const context = useContext(PropertyDataContext);
  if (!context) {
    throw new Error('usePropertyData must be used within a PropertyDataProvider');
  }
  return context;
};
