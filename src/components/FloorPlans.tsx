import React, { useState, useMemo } from 'react';
import { BedDouble, Bath, Square, Sparkles, ExternalLink, Calendar, Eye, ArrowRight, ArrowUpDown } from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';
import { FloorPlan } from '../types';

interface FloorPlansProps {
  selectedBedrooms: number | null;
  onSelectBedrooms: (beds: number | null) => void;
  onOpenPlanModal: (plan: FloorPlan) => void;
  onOpenTour: (planId?: string) => void;
}

export const FloorPlans: React.FC<FloorPlansProps> = ({
  selectedBedrooms,
  onSelectBedrooms,
  onOpenPlanModal,
  onOpenTour,
}) => {
  const { floorPlans, propertyInfo } = usePropertyData();
  const [sortBy, setSortBy] = useState<string>('price-asc');

  // Filter plans based on selected bedroom count
  const filteredPlans = useMemo(() => {
    return floorPlans.filter((plan) => {
      if (selectedBedrooms === null) return true;
      return plan.bedrooms === selectedBedrooms;
    });
  }, [floorPlans, selectedBedrooms]);

  // Robust sort comparator
  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.startingPrice - b.startingPrice;
        case 'price-desc':
          return b.startingPrice - a.startingPrice;
        case 'sqft-desc':
          return b.sqft - a.sqft;
        case 'sqft-asc':
          return a.sqft - b.sqft;
        case 'beds-asc':
          return a.bedrooms - b.bedrooms || a.startingPrice - b.startingPrice;
        case 'beds-desc':
          return b.bedrooms - a.bedrooms || a.startingPrice - b.startingPrice;
        default:
          return a.startingPrice - b.startingPrice;
      }
    });
  }, [filteredPlans, sortBy]);

  return (
    <section id="floor-plans" className="py-12 sm:py-14 bg-stone-100/70 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#c5a880]">
              Apartment Residences
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#233242] mt-1">
              Thoughtfully Designed Floor Plans
            </h2>
            <p className="text-stone-600 text-sm max-w-2xl mt-2 leading-relaxed">
              Explore our collection of 1, 2, and 3-bedroom layouts in Waxahachie. Each residence features gourmet granite kitchens, generous storage, and private outdoor living spaces.
            </p>
          </div>

          {/* Controls: Bed filter & Sort dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            {/* Bedroom filter pills */}
            <div className="flex items-center justify-between sm:justify-start bg-white p-1 rounded-xl border border-stone-300 shadow-2xs w-full sm:w-auto">
              <button
                id="filter-bed-all-btn"
                onClick={() => onSelectBedrooms(null)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[38px] flex items-center justify-center whitespace-nowrap ${
                  selectedBedrooms === null
                    ? 'bg-[#233242] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All
              </button>
              <button
                id="filter-bed-1-btn"
                onClick={() => onSelectBedrooms(1)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[38px] flex items-center justify-center whitespace-nowrap ${
                  selectedBedrooms === 1
                    ? 'bg-[#233242] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                1 Bed
              </button>
              <button
                id="filter-bed-2-btn"
                onClick={() => onSelectBedrooms(2)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[38px] flex items-center justify-center whitespace-nowrap ${
                  selectedBedrooms === 2
                    ? 'bg-[#233242] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                2 Beds
              </button>
              <button
                id="filter-bed-3-btn"
                onClick={() => onSelectBedrooms(3)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[38px] flex items-center justify-center whitespace-nowrap ${
                  selectedBedrooms === 3
                    ? 'bg-[#233242] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                3 Beds
              </button>
            </div>

            {/* Sort Selector with Icon */}
            <div className="relative flex items-center w-full sm:w-auto">
              <div className="absolute left-3 pointer-events-none text-stone-500">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
              <select
                id="floorplans-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto text-base sm:text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-lg pl-8 pr-8 py-2.5 sm:py-2 focus:ring-2 focus:ring-[#233242] focus:outline-none cursor-pointer shadow-2xs min-h-[40px]"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="sqft-desc">Size: Largest First</option>
                <option value="sqft-asc">Size: Smallest First</option>
                <option value="beds-asc">Bedrooms: 1 to 3</option>
                <option value="beds-desc">Bedrooms: 3 to 1</option>
              </select>
            </div>
          </div>
        </div>

        {/* Floor Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
          {sortedPlans.map((plan) => (
            <div
              key={plan.id}
              id={`floorplan-card-${plan.id}`}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              {/* Card Top */}
              <div className="p-4 sm:p-6">
                
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#233242] text-[#FAF0D7]">
                      Plan {plan.code}
                    </span>
                    {plan.popular && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF0D7] text-[#233242] border border-[#c5a880]/60 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#c5a880]" />
                        Popular
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-serif-luxury text-xl font-bold text-stone-900 group-hover:text-[#233242] transition-colors">
                  {plan.name}
                </h3>

                {/* Plan Image Preview when uploaded */}
                {((plan.images && plan.images.length > 0) || plan.imageUrl) && (
                  <div className="mt-3 aspect-16/9 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative">
                    <img 
                      src={plan.images?.[0] || plan.imageUrl} 
                      alt={plan.name} 
                      className="w-full h-full object-cover" 
                    />
                    {plan.images && plan.images.length > 1 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-stone-900/80 text-white text-[10px] font-bold rounded-md backdrop-blur-xs">
                        +{plan.images.length - 1} photos
                      </span>
                    )}
                  </div>
                )}

                {/* Specs */}
                <div className="mt-3 flex items-center justify-between py-2 px-2.5 sm:px-3 rounded-xl bg-stone-50 border border-stone-150 text-[11px] sm:text-xs text-stone-700">
                  <div className="flex items-center gap-1 sm:gap-1.5 font-medium whitespace-nowrap">
                    <BedDouble className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                    <span>{plan.bedrooms} Bed</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 font-medium whitespace-nowrap">
                    <Bath className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                    <span>{plan.bathrooms} Bath</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 font-medium whitespace-nowrap">
                    <Square className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                    <span>{plan.sqft} Sq. Ft.</span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-xs text-stone-600 leading-relaxed line-clamp-3">
                  {plan.description}
                </p>

                {/* Key bullets */}
                <ul className="mt-4 space-y-1.5 text-[11px] text-stone-600">
                  {plan.features.slice(0, 3).map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#c5a880] font-bold">•</span>
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer: Price & Actions */}
              <div className="p-4 sm:p-6 pt-0 mt-auto">
                <div className="pt-4 border-t border-stone-100 flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Starting at</span>
                    <span className="text-2xl font-bold text-[#233242]">
                      ${plan.startingPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-stone-500 font-normal"> / month</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-amber-800 font-semibold bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">Special Eligible</span>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id={`view-schematic-btn-${plan.id}`}
                    onClick={() => onOpenPlanModal(plan)}
                    className="w-full min-h-[44px] py-2.5 px-3 text-xs font-bold text-[#233242] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Plan</span>
                  </button>

                  <a
                    id={`apply-plan-btn-${plan.id}`}
                    href={propertyInfo.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full min-h-[44px] py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg shadow-xs transition-all flex items-center justify-center gap-1 text-center active:scale-98"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>

                <button
                  onClick={() => onOpenTour(plan.id)}
                  className="mt-2.5 w-full min-h-[40px] py-1.5 text-center text-xs font-semibold text-stone-600 hover:text-[#233242] bg-stone-50 hover:bg-stone-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Schedule Tour for this Model</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Application notice footer */}
        <div className="mt-12 p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="font-serif-luxury text-lg font-bold text-stone-900">
              Ready to claim your new home at The Ellis on Solon?
            </h4>
            <p className="text-xs text-stone-600 mt-0.5">
              Online applications take less than 10 minutes through our secure Blue Moon Software portal.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onOpenTour()}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            >
              Ask a Question
            </button>
            <a
              id="floorplans-bottom-apply-btn"
              href={propertyInfo.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 text-center"
            >
              <span>Apply Online</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
