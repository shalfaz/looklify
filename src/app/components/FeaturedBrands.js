'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";

export default function FeaturedBrands() {
  const [featuredBrands, setFeaturedBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchFeaturedBrands = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/shop/filters');
        
        if (response.ok) {
          const data = await response.json();
          setFeaturedBrands(data.data?.featuredBrands || []);
        } else {
          // Fallback to empty array if API fails
          setFeaturedBrands([]);
        }
      } catch (error) {
        console.error('Error fetching featured brands:', error);
        setFeaturedBrands([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBrands();
  }, []);

  // Auto-scroll horizontally when overflowed; pause on hover
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    if (!hasOverflow) return;

    let intervalId;
    const step = () => {
      if (!container || isHovered) return;
      const firstChild = container.firstElementChild;
      const itemWidth = firstChild ? firstChild.clientWidth + 16 /* approx gap */ : 144;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft + itemWidth >= maxScrollLeft - 2) {
        // Jump back to start without smooth behavior to avoid long animation
        container.scrollTo({ left: 0, behavior: 'auto' });
      } else {
        container.scrollBy({ left: itemWidth, behavior: 'smooth' });
      }
    };

    intervalId = setInterval(step, 2200);
    return () => clearInterval(intervalId);
  }, [featuredBrands, isHovered]);

  if (loading) {
    return (
      <section className="py-16 bg-[#F9F5F6] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2937] dark:text-gray-100 mb-3 sm:mb-4 relative">
              <span className="font-bold">Shop From Brands</span>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 sm:w-24 h-1 bg-[#881337] rounded-full"></div>
            </h2>
          </div>
          <div className="relative overflow-hidden">
            <div className="flex gap-4 overflow-hidden">
              {[...Array(7)].map((_, index) => (
                <div key={index} className="w-32 h-32 sm:w-40 sm:h-40 bg-white dark:bg-gray-800 rounded-xl border border-[#F1E8EC] dark:border-gray-700 animate-pulse flex-shrink-0">
                  <div className="w-full h-full bg-[#F3E8EE] dark:bg-gray-700 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Don't show section if no featured brands
  if (featuredBrands.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-16 bg-[#F9F5F6] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2937] dark:text-gray-100 mb-3 sm:mb-4 relative">
            <span className="font-bold">Shop From Brands</span>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 sm:w-24 h-1 bg-[#881337] rounded-full"></div>
          </h2>
        </div>

        {/* Single-line horizontal slider */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-3 sm:pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitScrollbar: { display: 'none' }
            }}
          >
            {featuredBrands.map((brand, index) => {
              // Subtle refined neutral/blush border tones for each card
              const borderColors = [
                'border-[#F1E8EC] hover:border-[#FBCFE8]',
                'border-[#F1E8EC] hover:border-[#D94E67]/50',
                'border-[#F1E8EC] hover:border-[#B08968]/60',
              ];
              const borderColor = borderColors[index % borderColors.length];
              
              return (
                <Link
                  key={brand._id}
                  href={`/shop?brand=${brand.slug || brand._id}`}
                  className={`group relative rounded-xl bg-white dark:bg-gray-800 border ${borderColor} dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 flex-shrink-0`}
                >
                  {/* Brand Logo - exact same structure as brands page */}
                  <div className="relative w-full h-full flex items-center justify-center p-3 z-10">
                    {brand.logo?.url ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={brand.logo.url}
                          alt={brand.logo.alt || brand.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 160px"
                          unoptimized={brand.logo.url.includes('cloudinary')}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-[#FDF2F8] dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-[#9D174D]/60 mb-1">
                          {brand.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-[#1F2937] dark:text-gray-200 line-clamp-1 px-2">
                          {brand.name}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* View All Button - Centered at bottom */}
        <div className="text-center mt-8">
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#881337] text-white rounded-xl hover:bg-[#6E0F2C] font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-md"
          >
            <span>View All Brands</span>
            <svg 
              className="w-5 h-5 transition-transform group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
      
      
    </section>
  );
}

