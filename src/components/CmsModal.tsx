import React, { useState } from 'react';
import { 
  X, Camera, LayoutDashboard, Building, Sparkles, MapPin, 
  Tag, Navigation, Lock, Key, LogOut, Eye, EyeOff, ShieldCheck, 
  ShieldAlert, Zap, Cloud, CloudOff, Loader2, Check, AlertTriangle, ExternalLink, Activity, Mail, Download 
} from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';
import { GalleryTab } from './cms/GalleryTab';
import { FloorPlansTab } from './cms/FloorPlansTab';
import { CouponsTab } from './cms/CouponsTab';
import { AmenitiesTab } from './cms/AmenitiesTab';
import { NeighborhoodTab } from './cms/NeighborhoodTab';
import { PropertyTab } from './cms/PropertyTab';
import { EnquiriesTab } from './cms/EnquiriesTab';

interface CmsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_EMAIL = 'ellisonsolon@gmail.com';
const ADMIN_PASSWORD = '111111';
const ADMIN_STORAGE_KEY = 'ellis_admin_auth_session';

export const CmsModal: React.FC<CmsModalProps> = ({ isOpen, onClose }) => {
  const {
    floorPlans,
    amenities,
    galleryItems,
    specialOffers,
    neighborhoodSpots,
    enquiries,
    cloudSyncStatus,
    isQuotaExhausted,
    clearQuotaFlag,
    forceSyncToCloud,
    refreshFromCloud,
    diagnostics,
  } = usePropertyData();

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem(ADMIN_STORAGE_KEY) === 'true' ||
        sessionStorage.getItem(ADMIN_STORAGE_KEY) === 'true'
      );
    } catch {
      return false;
    }
  });

  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState(ADMIN_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const [activeTab, setActiveTab] = useState<
    'enquiries' | 'gallery' | 'plans' | 'coupons' | 'amenities' | 'neighborhood' | 'property'
  >('enquiries');

  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setAuthError(null);
      try {
        if (rememberMe) {
          localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        } else {
          sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        }
      } catch (err) {
        console.warn('Storage unavailable:', err);
      }
      showNotification('Administrator credentials verified.');
    } else {
      setAuthError('Incorrect administrator email or password.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch (err) {
      console.warn('Storage unavailable:', err);
    }
    showNotification('Signed out of Administrator Portal.');
  };

  // If Not Authenticated, show Login Form
  if (!isAdminAuthenticated) {
    return (
      <div 
        id="cms-login-backdrop" 
        className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          id="cms-login-container"
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="bg-[#233242] text-[#FAF0D7] px-6 py-5 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF0D7]/15 border border-[#c5a880]/50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-[#FAF0D7]" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-base font-bold text-white tracking-wide">
                  The Ellis on Solon CMS
                </h3>
                <p className="text-[11px] text-slate-300">Administrative Management Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="p-6 space-y-4 text-stone-700">
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full text-xs px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-600">
              <input
                type="checkbox"
                id="remember-admin-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-stone-300 text-[#233242] focus:ring-[#233242] cursor-pointer"
              />
              <label htmlFor="remember-admin-checkbox" className="cursor-pointer select-none">
                Stay signed in on this browser
              </label>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                id="admin-login-submit-btn"
                className="w-full py-3 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#233242] hover:bg-[#1a2633] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#FAF0D7]" />
                <span>Sign In as Admin</span>
              </button>

              <button
                type="button"
                id="admin-quick-login-btn"
                onClick={() => {
                  setLoginEmail(ADMIN_EMAIL);
                  setLoginPassword(ADMIN_PASSWORD);
                  setIsAdminAuthenticated(true);
                  try {
                    localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
                    sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
                  } catch (e) {
                    console.warn(e);
                  }
                  showNotification('Welcome, Administrator! Immediate CMS access granted.');
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#233242] hover:text-black bg-[#FAF0D7] hover:bg-[#fae7be] border border-[#c5a880]/60 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Instant 1-Click CMS Access</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="cms-modal-backdrop" 
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="cms-modal-container"
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[94vh] animate-in fade-in zoom-in-95 duration-200 my-auto"
      >
        {/* CMS Top Header */}
        <div className="bg-[#233242] text-[#FAF0D7] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#FAF0D7]/15 border border-[#c5a880]/50 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-[#FAF0D7]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="font-serif-luxury text-base sm:text-xl font-bold text-white tracking-wide truncate">
                  The Ellis on Solon CMS
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c5a880]/30 text-amber-200 border border-[#c5a880]/40 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  ellisonsolon@gmail.com
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate hidden xs:block">
                Add photos, update floor plans, upload amenities & neighbourhood destinations with live cloud persistence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Download Full Database Backup */}
            <a
              href="/api/download-database"
              download
              id="cms-download-database-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
              title="Download complete Firestore database backup (.json)"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Backup DB</span>
            </a>

            {/* Live Diagnostics Toggle */}
            <button
              type="button"
              id="cms-diagnostics-toggle-btn"
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                showDiagnostics
                  ? 'bg-sky-500/30 text-sky-200 border-sky-400/50'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
              }`}
              title="Toggle Live Cloud Sync Diagnostics & Health Telemetry"
            >
              <Activity className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">Telemetry</span>
            </button>

            {/* Optimistic UI Background Cloud Sync Badge & Manual Cloud Sync Control */}
            {isQuotaExhausted ? (
              <span id="cloud-sync-badge-quota" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30" title="Firestore daily free write quota reached. Local caching active.">
                <AlertTriangle className="w-3 h-3 text-amber-300" />
                <span className="hidden sm:inline">Local Cache (Daily Quota)</span>
                <span className="sm:hidden">Local Cache</span>
              </span>
            ) : (
              <>
                {cloudSyncStatus === 'syncing' && (
                  <span id="cloud-sync-badge-syncing" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-sky-300" />
                    <span className="hidden sm:inline">Syncing to cloud...</span>
                    <span className="sm:hidden">Syncing</span>
                  </span>
                )}
                {cloudSyncStatus === 'saved' && (
                  <button
                    type="button"
                    id="cloud-sync-badge-saved"
                    onClick={async () => {
                      showNotification('Syncing all property records to cloud...');
                      const res = await forceSyncToCloud();
                      if (res && res.message) {
                        showNotification(res.message);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border border-emerald-400/30 transition-all cursor-pointer"
                    title="Click to force re-sync all records to cloud"
                  >
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span className="hidden sm:inline">Cloud synced</span>
                    <span className="sm:hidden">Saved</span>
                  </button>
                )}
                {cloudSyncStatus === 'error' && (
                  <button
                    type="button"
                    id="cloud-sync-badge-error"
                    onClick={async () => {
                      showNotification('Retrying cloud synchronization...');
                      const res = await forceSyncToCloud();
                      if (res && res.message) {
                        showNotification(res.message);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 transition-all cursor-pointer"
                    title="Cloud sync encountered a network delay. Click to retry syncing immediately."
                  >
                    <CloudOff className="w-3 h-3 text-amber-300" />
                    <span className="hidden sm:inline">Retry Cloud Sync</span>
                    <span className="sm:hidden">Retry</span>
                  </button>
                )}
                {cloudSyncStatus === 'idle' && (
                  <button
                    type="button"
                    id="cloud-sync-badge-idle"
                    onClick={async () => {
                      showNotification('Refreshing latest records from cloud...');
                      await refreshFromCloud();
                      showNotification('Up to date with cloud database!');
                    }}
                    className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-slate-300/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    title="Click to refresh latest data from cloud"
                  >
                    <Cloud className="w-3 h-3 text-slate-400" />
                    <span>Cloud connected</span>
                  </button>
                )}
              </>
            )}

            <button
              id="admin-logout-btn"
              onClick={handleAdminLogout}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 rounded-lg border border-amber-400/40 transition-colors cursor-pointer min-h-[36px]"
              title="Sign out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign Out</span>
            </button>

            <button
              id="close-cms-btn"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close CMS"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Diagnostics Drawer */}
        {showDiagnostics && (
          <div id="cms-telemetry-drawer" className="bg-slate-900 border-b border-slate-700/80 px-4 py-3 sm:px-6 text-xs text-slate-300 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sky-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                <span>Cloud Synchronization Telemetry & Quota Health</span>
              </div>
              <span className="text-[10px] text-slate-400">Database: ai-studio-remixtheellisons-bed8ac62-2ecb-4253-aae6-7765d56fa3c5</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Save Clicks</div>
                <div className="text-base font-bold text-white mt-0.5">{diagnostics.saveClicks}</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Writes Attempted</div>
                <div className="text-base font-bold text-sky-300 mt-0.5">{diagnostics.cloudWritesAttempted}</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Writes Succeeded</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{diagnostics.cloudWritesSuccess}</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Writes Failed</div>
                <div className="text-base font-bold text-rose-400 mt-0.5">{diagnostics.cloudWritesFailed}</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Rate Limits (429)</div>
                <div className={`text-base font-bold mt-0.5 ${diagnostics.rateLimitHits > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {diagnostics.rateLimitHits}
                </div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Pending Sections</div>
                <div className="text-base font-bold text-white mt-0.5">{diagnostics.pendingQueueSize}</div>
              </div>
            </div>
            {diagnostics.lastError && (
              <div className="mt-2 text-[11px] text-rose-300/90 font-mono truncate bg-rose-950/40 px-2 py-1 rounded border border-rose-900/50">
                Last Error: {diagnostics.lastError}
              </div>
            )}
          </div>
        )}

        {/* Quota Exceeded Notification Banner */}
        {isQuotaExhausted && (
          <div className="bg-amber-950/90 border-b border-amber-500/30 px-4 py-2.5 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-200 shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-300">
                  Firestore Free Tier Daily Write Limit Reached (20,000 writes/day)
                </div>
                <div className="text-amber-200/90 text-[11px] mt-0.5 leading-relaxed">
                  All property modifications are safely preserved in high-capacity local storage (IndexedDB) and remain live across your sessions.
                  Coalesced cloud synchronization will automatically resume when Google Cloud resets the daily write quota (midnight Pacific Time).
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <a
                href="https://console.firebase.google.com/project/complete-might-dv9wh/firestore/databases/ai-studio-remixtheellisons-bed8ac62-2ecb-4253-aae6-7765d56fa3c5/data?openUpgradeDialog=true"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold transition-colors"
              >
                <span>Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={async () => {
                  showNotification('Testing cloud database connection...');
                  const res = await forceSyncToCloud(true);
                  if (res && res.message) {
                    showNotification(res.message);
                  }
                }}
                className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-semibold transition-colors cursor-pointer"
                title="Test if daily quota has reset or billing was upgraded"
              >
                Retry Sync
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation Bar */}
        <div className="bg-stone-100 border-b border-stone-200 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 shrink-0 overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
            <button
              id="cms-tab-enquiries"
              onClick={() => setActiveTab('enquiries')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'enquiries'
                  ? 'bg-[#233242] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Enquiries ({enquiries.length})</span>
              {enquiries.some((e) => e.emailStatus === 'failed') && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" title="Failed email delivery detected" />
              )}
            </button>

            <button
              id="cms-tab-gallery"
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'gallery'
                  ? 'bg-[#233242] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photos ({galleryItems.length})</span>
            </button>

            <button
              id="cms-tab-plans"
              onClick={() => setActiveTab('plans')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'plans'
                  ? 'bg-[#233242] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Floor Plans ({floorPlans.length})</span>
            </button>

            <button
              id="cms-tab-coupons"
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'coupons'
                  ? 'bg-[#233242] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Coupons ({specialOffers.length})</span>
            </button>

            <button
              id="cms-tab-amenities"
              onClick={() => setActiveTab('amenities')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'amenities'
                  ? 'bg-[#233242] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Amenities ({amenities.length})</span>
            </button>

            <button
              id="cms-tab-neighborhood"
              onClick={() => setActiveTab('neighborhood')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'neighborhood'
                  ? 'bg-[#233242] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span>Neighbourhood ({neighborhoodSpots.length})</span>
            </button>

            <button
              id="cms-tab-property"
              onClick={() => setActiveTab('property')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'property'
                  ? 'bg-[#233242] text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Property Details</span>
            </button>
          </div>
        </div>

        {/* Live Notification Toast */}
        {saveToast && (
          <div 
            id="cms-notification-toast"
            className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-top-2"
          >
            <span>{saveToast}</span>
            <button 
              onClick={() => setSaveToast(null)}
              className="text-emerald-200 hover:text-white p-0.5 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Content Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {activeTab === 'enquiries' && <EnquiriesTab />}
          {activeTab === 'gallery' && <GalleryTab onNotify={showNotification} />}
          {activeTab === 'plans' && <FloorPlansTab onNotify={showNotification} />}
          {activeTab === 'coupons' && <CouponsTab onNotify={showNotification} />}
          {activeTab === 'amenities' && <AmenitiesTab onNotify={showNotification} />}
          {activeTab === 'neighborhood' && <NeighborhoodTab onNotify={showNotification} />}
          {activeTab === 'property' && <PropertyTab onNotify={showNotification} />}
        </div>
      </div>
    </div>
  );
};
