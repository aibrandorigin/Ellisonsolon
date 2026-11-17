import React, { useState } from 'react';
import { 
  MapPin, Navigation, GraduationCap, Utensils, ShoppingBag, 
  Trees, ExternalLink, Car, Clock, Search, Check, Copy 
} from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';

export const Neighborhood: React.FC = () => {
  const { propertyInfo, neighborhoodSpots } = usePropertyData();
  const [activeCategory, setActiveCategory] = useState<'all' | 'education' | 'dining' | 'shopping' | 'recreation'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSpots = neighborhoodSpots.filter((spot) => {
    const matchesCategory = activeCategory === 'all' || spot.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (spot.address && spot.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return neighborhoodSpots.length;
    return neighborhoodSpots.filter(s => s.category === cat).length;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'education': return <GraduationCap className="w-4 h-4 text-indigo-700" />;
      case 'dining': return <Utensils className="w-4 h-4 text-amber-700" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4 text-blue-700" />;
      case 'recreation': return <Trees className="w-4 h-4 text-emerald-700" />;
      default: return <MapPin className="w-4 h-4 text-[#c5a880]" />;
    }
  };

  const getDirectionsUrl = (spot: { name: string; address?: string }) => {
    const origin = encodeURIComponent('1000 Solon Place Way, Waxahachie, TX 75165');
    const destination = encodeURIComponent(spot.address || `${spot.name}, Waxahachie, TX`);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  };

  const handleCopyAddress = (spotId: string, address?: string, name?: string) => {
    const textToCopy = address || `${name}, Waxahachie, TX`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(spotId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = [
    { id: 'all', label: 'All Destinations' },
    { id: 'shopping', label: 'Shopping & Groceries' },
    { id: 'dining', label: 'Dining & Downtown' },
    { id: 'education', label: 'Colleges & Schools' },
    { id: 'recreation', label: 'Parks & Lakes' },
  ];

  return (
    <section id="neighborhood" className="py-12 sm:py-14 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c5a880]">
            Waxahachie, Texas Living
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#233242] mt-1">
            Everything You Need, Close to Home
          </h2>
          <p className="text-stone-600 text-sm mt-2 leading-relaxed">
            Conveniently situated at <strong className="text-stone-900">{propertyInfo.address}</strong>, enjoy quick access to premier shopping centers, H-E-B, Target, Navarro College, vibrant historic squares, and direct highway commutes into the DFW metroplex.
          </p>
        </div>

        {/* Two-column layout: Map / Location visual on left, local spots on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Interactive Map Graphic & Commute Card */}
          <div className="lg:col-span-6 space-y-5">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 group">
              {/* Google Map view */}
              <iframe
                title="The Ellis on Solon Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3368.7423376717585!2d-96.84883902347248!3d32.385739973827435!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864eeb3544d67e71%3A0x2dbcd9c2a71e16f3!2s1000%20Solon%20Place%20Way%2C%20Waxahachie%2C%20TX%2075165!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                className="w-full h-72 sm:h-80 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Map Floating Bar */}
              <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#233242]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 leading-tight">The Ellis on Solon</h4>
                    <p className="text-[11px] text-stone-500">{propertyInfo.address}</p>
                  </div>
                </div>

                <a
                  id="neighborhood-get-directions-btn"
                  href="https://www.google.com/maps/dir/?api=1&destination=1000+Solon+Place+Way,+Waxahachie,+TX+75165"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
                  title="Open driving directions in Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Driving Directions</span>
                </a>
              </div>
            </div>

            {/* Commute Highlights Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#233242] text-white shadow-md">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-[#FAF0D7]" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="font-serif-luxury text-base font-bold text-[#FAF0D7]">
                      DFW Commuter-Friendly Arterial Access
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-[#FAF0D7]/20 text-[#FAF0D7] px-2 py-0.5 rounded">
                      Fast Route
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    Direct arterial access to <strong>I-35E South/North</strong> and <strong>US-77 / US-287</strong> allows you to reach Downtown Dallas in approximately 35 minutes, while returning home to the quiet peace of Waxahachie each evening.
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="text-[11px] text-slate-300">
                      <span>Waxahachie ↔ Downtown Dallas: <strong>31 miles (~35 min)</strong></span>
                    </div>
                    <a
                      id="commute-route-dallas-btn"
                      href="https://www.google.com/maps/dir/?api=1&origin=1000+Solon+Place+Way,+Waxahachie,+TX+75165&destination=Downtown+Dallas,+TX"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 rounded-lg bg-[#FAF0D7] hover:bg-white text-slate-950 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      title="Open Google Maps Commute Route"
                    >
                      <Navigation className="w-3 h-3 text-[#233242]" />
                      <span>View Commute Route</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Neighborhood Directory */}
          <div className="lg:col-span-6 space-y-3.5">
            
            {/* Search & Category Filter Controls */}
            <div className="space-y-2.5">
              {/* Quick Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search destinations (e.g. H-E-B, Target, dining, park)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-base sm:text-xs pl-9 pr-14 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#233242] focus:outline-none min-h-[44px]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500 hover:text-stone-800 font-bold p-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Filter Chips (Horizontally swipeable on mobile, wrapped on desktop) */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 sm:pb-0 px-1 -mx-4 sm:mx-0 sm:flex-wrap">
                {categories.map((tab) => {
                  const count = getCategoryCount(tab.id);
                  const isSelected = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`neighborhood-tab-${tab.id}`}
                      onClick={() => setActiveCategory(tab.id as any)}
                      className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#233242] text-white shadow-xs font-bold'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spot Cards */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredSpots.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 text-xs text-stone-500">
                  No destinations match "{searchQuery}". <br/>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="mt-2 text-[#233242] font-bold underline"
                  >
                    View all destinations
                  </button>
                </div>
              ) : (
                filteredSpots.map((spot) => (
                  <div
                    key={spot.id}
                    id={`neighborhood-spot-${spot.id}`}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-white hover:border-[#c5a880] transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {(spot.image || (spot.images && spot.images.length > 0)) ? (
                          <div className="relative shrink-0">
                            <img
                              src={spot.image || (spot.images && spot.images[0])}
                              alt={spot.name}
                              className="w-12 h-12 rounded-lg object-cover border border-stone-200 shadow-2xs shrink-0"
                            />
                            {spot.images && spot.images.length > 1 && (
                              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-stone-900/80 text-white text-[9px] font-bold rounded">
                                +{spot.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-white border border-stone-200 shadow-2xs shrink-0">
                            {getCategoryIcon(spot.category)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-stone-900 leading-snug">
                            {spot.name}
                          </h4>
                          {spot.address && (
                            <p className="text-[11px] text-stone-500">{spot.address}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold text-[#233242] bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        <Clock className="w-3 h-3 text-[#c5a880]" />
                        <span>{spot.timeDrive}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 mt-2 leading-relaxed pl-9">
                      {spot.description}
                    </p>

                    <div className="mt-2.5 text-[11px] text-stone-400 font-medium pl-9 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2">
                      <span>{spot.distance} from The Ellis</span>

                      <div className="flex items-center gap-2">
                        {/* Copy Address Button */}
                        <button
                          id={`copy-address-btn-${spot.id}`}
                          onClick={() => handleCopyAddress(spot.id, spot.address, spot.name)}
                          className="text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-white hover:bg-stone-50 px-2 py-0.8 rounded border border-stone-200 text-[10px] font-medium transition-colors cursor-pointer"
                          title="Copy address to clipboard"
                        >
                          {copiedId === spot.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-stone-400" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </button>

                        {/* Map Route Button */}
                        <a
                          id={`map-route-link-${spot.id}`}
                          href={getDirectionsUrl(spot)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#233242] hover:text-[#c5a880] font-bold hover:underline flex items-center gap-1 bg-white hover:bg-stone-50 px-2.5 py-1 rounded border border-stone-200 transition-colors text-xs cursor-pointer shadow-2xs"
                          title={`Get turn-by-turn driving directions to ${spot.name}`}
                        >
                          <Navigation className="w-3 h-3 text-[#c5a880]" />
                          <span>Map Route</span>
                          <ExternalLink className="w-2.5 h-2.5 text-stone-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
