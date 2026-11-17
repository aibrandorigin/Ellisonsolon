import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'full-badge' | 'transparent' | 'emblem-only';
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-10 w-auto',
  variant = 'full-badge',
  alt = 'The Ellis on Solon',
}) => {
  if (variant === 'full-badge') {
    return (
      <img
        src="/Ellis_logo_navy-02.png"
        alt={alt}
        className={`${className} object-contain rounded-xs select-none`}
        loading="eager"
      />
    );
  }

  if (variant === 'emblem-only') {
    return (
      <svg
        viewBox="0 0 210 230"
        className={`${className} select-none`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={alt}
      >
        {/* Base Cream Architectural Block */}
        <rect x="0" y="0" width="210" height="230" fill="#FAF0D7" rx="2" />

        {/* Upper Diamond Cutout in Navy */}
        <polygon points="18,63 95,28 172,63 95,98" fill="#233242" />
        {/* Upper Right Beveled Entry */}
        <polygon points="172,63 211,46 211,80" fill="#233242" />

        {/* Lower Diamond Cutout in Navy */}
        <polygon points="18,167 95,132 172,167 95,202" fill="#233242" />
        {/* Lower Right Beveled Entry */}
        <polygon points="172,167 211,150 211,184" fill="#233242" />
      </svg>
    );
  }

  // Transparent variant (for embedding without fixed dark canvas, or on navy surfaces)
  return (
    <div className={`flex items-center gap-2.5 ${className} select-none`}>
      {/* Emblem */}
      <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9">
        <svg
          viewBox="0 0 210 230"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="210" height="230" fill="#FAF0D7" rx="2" />
          <polygon points="18,63 95,28 172,63 95,98" fill="#233242" />
          <polygon points="172,63 211,46 211,80" fill="#233242" />
          <polygon points="18,167 95,132 172,167 95,202" fill="#233242" />
          <polygon points="172,167 211,150 211,184" fill="#233242" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center leading-none">
        <span className="font-serif-luxury text-base sm:text-lg font-bold tracking-[0.18em] text-[#FAF0D7] uppercase">
          THE ELLIS
        </span>
        <span className="font-serif-luxury text-[10px] sm:text-[11px] font-semibold tracking-[0.52em] text-[#FAF0D7] uppercase mt-0.5">
          ON SOLON
        </span>
      </div>
    </div>
  );
};
