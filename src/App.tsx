import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FloatingSidebar } from './components/FloatingSidebar';
import { MobileBottomBar } from './components/MobileBottomBar';
import { Hero } from './components/Hero';
import { FloorPlans } from './components/FloorPlans';
import { Amenities } from './components/Amenities';
import { Gallery } from './components/Gallery';
import { Neighborhood } from './components/Neighborhood';
import { Footer } from './components/Footer';
import { SpecialsModal } from './components/SpecialsModal';
import { TourModal } from './components/TourModal';
import { FloorPlanModal } from './components/FloorPlanModal';
import { GalleryLightbox } from './components/GalleryLightbox';
import { CmsModal } from './components/CmsModal';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { PropertyDataProvider, usePropertyData } from './context/PropertyDataContext';
import { FloorPlan, GalleryItem } from './types';

function MainAppContent() {
  const { galleryItems } = usePropertyData();

  // Modal states
  const [specialsOpen, setSpecialsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourPlanId, setTourPlanId] = useState<string | undefined>(undefined);
  const [cmsOpen, setCmsOpen] = useState(false);
  
  // Floor plan details modal
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  // Bedroom filter state (synced with Hero and FloorPlans section)
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);

  // Mobile navigation menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState<GalleryItem[]>(galleryItems);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Alt+A or Cmd+Alt+A opens Admin CMS
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        setCmsOpen((prev) => !prev);
      }
    };
    if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
      setCmsOpen(true);
    }
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCmsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleOpenTour = (planId?: string) => {
    setTourPlanId(planId);
    setTourOpen(true);
  };

  const handleOpenPlanModal = (plan: FloorPlan) => {
    setSelectedPlan(plan);
    setPlanModalOpen(true);
  };

  const handleOpenLightbox = (items: GalleryItem[], index: number) => {
    setLightboxItems(items);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-200 selection:text-stone-900 font-sans-clean">
      {/* 1. Header & Navigation (Optimized for Mobile, Tablet, Desktop) */}
      <Header
        onOpenSpecials={() => setSpecialsOpen(true)}
        onOpenTour={() => handleOpenTour()}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onFilterBedrooms={(beds) => setSelectedBedrooms(beds)}
      />

      {/* 2. Floating Sidebar / Quick Contact Widget (Visible on Tablet & Desktop) */}
      <FloatingSidebar
        onOpenSpecials={() => setSpecialsOpen(true)}
        onOpenTour={() => handleOpenTour()}
      />

      {/* 3. Main Content Sections */}
      <main className="flex-1 pb-20 sm:pb-0">
        {/* Hero Section */}
        <Hero
          onOpenSpecials={() => setSpecialsOpen(true)}
          onOpenTour={() => handleOpenTour()}
          onFilterBedrooms={(beds) => setSelectedBedrooms(beds)}
        />

        {/* Floor Plans Section with robust live sorting */}
        <FloorPlans
          selectedBedrooms={selectedBedrooms}
          onSelectBedrooms={setSelectedBedrooms}
          onOpenPlanModal={handleOpenPlanModal}
          onOpenTour={handleOpenTour}
        />

        {/* Amenities Section in Gallery Style with static highlights */}
        <Amenities
          onOpenTour={() => handleOpenTour()}
        />

        {/* Photo Gallery Section */}
        <Gallery
          onOpenLightbox={handleOpenLightbox}
        />

        {/* Neighborhood Section with all allocated map routes and shopping links */}
        <Neighborhood />
      </main>

      {/* 4. Footer with BrandOrigin credit and equal housing */}
      <Footer
        onOpenSpecials={() => setSpecialsOpen(true)}
        onOpenTour={() => handleOpenTour()}
        onOpenCms={() => setCmsOpen(true)}
      />

      {/* 5. Mobile Sticky Bottom Navigation Bar (Visible on mobile screens < 640px) */}
      <MobileBottomBar
        onOpenSpecials={() => setSpecialsOpen(true)}
        onOpenTour={() => handleOpenTour()}
        onToggleMenu={() => setMobileMenuOpen((prev) => !prev)}
        isMenuOpen={mobileMenuOpen}
      />

      {/* Deluxe Mobile & Tablet Slide-Over Navigation Drawer - Teleported with z-[100] to appear above all banners & headers */}
      <MobileNavDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenSpecials={() => {
          setMobileMenuOpen(false);
          setSpecialsOpen(true);
        }}
        onOpenTour={() => {
          setMobileMenuOpen(false);
          handleOpenTour();
        }}
        onFilterBedrooms={(beds) => {
          setSelectedBedrooms(beds);
          setMobileMenuOpen(false);
        }}
      />

      {/* 6. Modals & Overlays */}
      <SpecialsModal
        isOpen={specialsOpen}
        onClose={() => setSpecialsOpen(false)}
        onOpenTour={() => handleOpenTour()}
      />

      <TourModal
        isOpen={tourOpen}
        onClose={() => {
          setTourOpen(false);
          setTourPlanId(undefined);
        }}
        selectedFloorPlanId={tourPlanId}
      />

      <FloorPlanModal
        plan={selectedPlan}
        isOpen={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false);
          setSelectedPlan(null);
        }}
        onOpenTour={(planId) => handleOpenTour(planId)}
      />

      <GalleryLightbox
        items={lightboxItems.length > 0 ? lightboxItems : galleryItems}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />

      {/* 6. Admin Content Management System (CMS) */}
      <CmsModal
        isOpen={cmsOpen}
        onClose={() => setCmsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <PropertyDataProvider>
      <MainAppContent />
    </PropertyDataProvider>
  );
}
