export interface FloorPlan {
  id: string;
  name: string;
  code: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  startingPrice: number;
  deposit?: number;
  description: string;
  availableCount: number;
  popular?: boolean;
  features: string[];
  dimensions: {
    living: string;
    masterBed: string;
    bed2?: string;
    bed3?: string;
    balcony: string;
  };
  imageUrl?: string;
  images?: string[];
}

export interface Amenity {
  id: string;
  title: string;
  description: string;
  category: 'community' | 'apartment' | string;
  icon: string;
  highlight?: boolean;
  image?: string;
  images?: string[];
}

export interface GalleryCategory {
  id: string;
  label: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  imageUrl: string;
  caption: string;
  images?: string[];
}

export interface NeighborhoodSpot {
  id: string;
  name: string;
  category: 'education' | 'dining' | 'shopping' | 'recreation' | string;
  distance: string;
  timeDrive: string;
  description: string;
  address?: string;
  image?: string;
  images?: string[];
}

export interface SpecialOffer {
  id: string;
  title: string;
  badge: string;
  description: string;
  terms: string;
  expiresDate: string;
  highlightCode?: string;
  discountType?: 'fixed' | 'percentage' | 'months_free' | 'fee_waiver';
  discountValue?: string;
  active?: boolean;
  image?: string;
  images?: string[];
}

export interface PropertyInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  displayPhone: string;
  email: string;
  applyUrl: string;
  residentsUrl: string;
  cityStateZip?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  management?: string;
  hours?: Array<{ days: string; time: string }>;
  petPolicy?: {
    allowed: string;
    maxPets: number;
    maxWeight: string;
    deposit?: string;
    oneTimeFee?: string;
    monthlyRent: string;
    highlight: string;
  };
  images?: string[];
  videoTourUrl?: string;
  videoTourPoster?: string;
  videoTourTitle?: string;
  videoTourDescription?: string;
}

export interface VideoChapter {
  id: string;
  title: string;
  timeSeconds: number;
  description: string;
  badge: string;
}

export interface CommunityVideo {
  id: string;
  title: string;
  description: string;
  category: 'aerial' | 'walkthrough' | 'amenities' | 'interior' | 'grounds';
  videoUrl: string;
  posterUrl?: string;
  duration?: string;
  isFeatured?: boolean;
  uploadedBlobId?: string;
  sourceType?: 'file' | 'url' | 'sample';
  fileSizeFormatted?: string;
  chapters?: VideoChapter[];
  createdAt?: string;
}

export interface TourBookingData {
  tourType: 'in-person' | 'self-guided' | 'virtual';
  preferredDate: string;
  preferredTime: string;
  floorPlanId: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface SyncDiagnostics {
  saveClicks: number;
  cloudWritesAttempted: number;
  cloudWritesSuccess: number;
  cloudWritesFailed: number;
  rateLimitHits: number;
  activeRequests: number;
  pendingQueueSize: number;
  lastError: string | null;
  lastWriteTimestamp: number | null;
}

export type EmailDeliveryStatus = 'sent' | 'pending' | 'failed';

export interface Enquiry {
  id: string; // e.g. "ENQ-20261006-8A3F"
  createdAt: string; // ISO 8601 string
  customerName: string;
  phone: string;
  email?: string;
  enquiryType: 'Tour Request' | 'Quick Message' | 'General Enquiry';
  service?: string; // e.g. "In-Person Guided Tour", "Live Virtual Tour", "General Inquiry"
  preferredDate?: string;
  preferredTime?: string;
  floorPlanInterest?: string;
  message?: string;
  location?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'closed';
  emailStatus: EmailDeliveryStatus;
  emailRecipient: string; // e.g. "ellisonsolon@gmail.com"
  emailError?: string | null;
  emailSentAt?: string | null;
  emailAttempts: number;
  additionalDetails?: Record<string, string>;
}

