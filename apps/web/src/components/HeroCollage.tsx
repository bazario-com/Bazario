'use client';

import { useState } from 'react';

function HeroImg({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setHidden(true);
        }
      }}
    />
  );
}

// Product images live at /public/images/hero/*.webp — until they're supplied,
// each falls back gracefully to nothing (or to the logo, for the bag) rather
// than showing a broken-image icon.
export function HeroCollage() {
  return (
    <div className="relative flex h-72 items-center justify-center md:h-96">
      <div
        className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-marigold-100 to-ink-100 md:h-72 md:w-72"
        aria-hidden
      />

      {/* Laptop/tablet — furthest back */}
      <HeroImg
        src="/images/hero/laptop.webp"
        alt=""
        className="absolute right-6 -top-2 z-0 h-20 w-20 object-contain opacity-90 md:right-10 md:h-32 md:w-32"
      />

      {/* Smartphone — behind left */}
      <HeroImg
        src="/images/hero/smartphone.webp"
        alt=""
        className="absolute left-0 top-6 z-10 h-16 w-16 object-contain drop-shadow-md md:left-2 md:top-10 md:h-24 md:w-24"
      />

      {/* Handbag — left */}
      <HeroImg
        src="/images/hero/handbag.webp"
        alt=""
        className="absolute bottom-16 left-2 z-10 h-16 w-16 object-contain drop-shadow-md md:bottom-20 md:left-4 md:h-24 md:w-24"
      />

      {/* Smartwatch — bottom left */}
      <HeroImg
        src="/images/hero/smartwatch.webp"
        alt=""
        className="absolute bottom-0 left-10 z-10 h-12 w-12 object-contain drop-shadow-md md:bottom-2 md:left-16 md:h-16 md:w-16"
      />

      {/* Shopina bag — center/right, the hero's focal point */}
      <HeroImg
        src="/images/hero/shopina-bag.webp"
        fallbackSrc="/logo.png"
        alt="Shopina"
        className="relative z-20 h-44 w-44 object-contain drop-shadow-2xl md:h-80 md:w-80"
      />

      {/* Cosmetics — right */}
      <HeroImg
        src="/images/hero/cosmetics.webp"
        alt=""
        className="absolute right-2 top-10 z-10 h-14 w-14 object-contain drop-shadow-md md:right-4 md:top-16 md:h-20 md:w-20"
      />

      {/* Jewelry — right/front */}
      <HeroImg
        src="/images/hero/jewelry.webp"
        alt=""
        className="absolute bottom-10 right-4 z-20 h-12 w-12 object-contain drop-shadow-lg md:bottom-14 md:right-8 md:h-16 md:w-16"
      />

      {/* Sneakers — bottom/front, layered above the bag */}
      <HeroImg
        src="/images/hero/sneakers.webp"
        alt=""
        className="absolute bottom-0 left-1/2 z-30 h-16 w-16 -translate-x-1/2 object-contain drop-shadow-xl md:bottom-2 md:h-24 md:w-24"
      />
    </div>
  );
}
