'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

// Custom Image Component with better error handling
function ProductImage({ src, alt, className, onError }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);
    
    // Preload image to check if it exists
    if (src && src !== '/slider/1.webp') {
      const img = new window.Image();
      img.onload = () => setIsLoading(false);
      img.onerror = () => {
        console.error('Image failed to load:', src);
        setHasError(true);
        setIsLoading(false);
        if (onError) onError();
      };
      img.src = src;
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [src, onError]);

  if (hasError || !imgSrc || imgSrc === '/slider/1.webp') {
    return (
      <div className={`w-full h-full bg-[#FDF2F8] flex items-center justify-center text-6xl ${className}`}>
        📦
      </div>
    );
  }

  return (
    <>
      {/* Background that prevents black screen */}
      <div className="absolute inset-0 bg-white" />
      {isLoading && (
        <div className="absolute inset-0 bg-white animate-pulse z-10" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 relative z-20 select-none`}
        style={{ 
          objectFit: 'contain',
          userSelect: 'none',
          WebkitUserDrag: 'none',
          WebkitUserSelect: 'none',
          pointerEvents: 'none',
          touchAction: 'none'
        }}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        onLoadingComplete={() => setIsLoading(false)}
        unoptimized={imgSrc.includes('cloudinary')}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </>
  );
}

export default function PopularProductsOnOffer() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  const sliderRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const container = sliderRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [products]);

  const scrollSlider = (direction) => {
    const container = sliderRef.current;
    if (!container) return;
    const firstCard = container.firstElementChild;
    const computedStyle = window.getComputedStyle(container);
    const gap = parseFloat(computedStyle.columnGap || computedStyle.gap || '16') || 16;
    const step = firstCard ? firstCard.getBoundingClientRect().width + gap : container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  // Subtle auto-play on idle (pauses on hover/touch)
  useEffect(() => {
    const container = sliderRef.current;
    if (!container || products.length === 0) return;

    const intervalId = setInterval(() => {
      if (!sliderRef.current || isHovered) return;
      const el = sliderRef.current;
      if (el.scrollWidth <= el.clientWidth + 4) return;

      const firstCard = el.firstElementChild;
      const computedStyle = window.getComputedStyle(el);
      const gap = parseFloat(computedStyle.columnGap || computedStyle.gap || '16') || 16;
      const step = firstCard ? firstCard.getBoundingClientRect().width + gap : 260;

      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [products, isHovered]);

  // Prevent image download protection
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable common keyboard shortcuts
    const handleKeyDown = (e) => {
      // Disable Ctrl+S, Ctrl+P, Ctrl+A, F12, etc.
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'u' || e.key === 'i')
      ) {
        e.preventDefault();
        return false;
      }
      // Disable F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
    };

    // Disable drag start
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable select start
    const handleSelectStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  useEffect(() => {
    const fetchProductsOnOffer = async () => {
      try {
        setLoading(true);
        // Fetch all products with isOfferProduct=true, no limit restriction
        const response = await fetch('/api/products?limit=100&status=active&isOfferProduct=true');
        
        if (response.ok) {
          const data = await response.json();
          const allProducts = data.data?.products || [];
          
          // Sort by discount percentage (highest first) - show all offer products
          const sortedProducts = allProducts
            .map(product => {
              let discount = 0;
              if (product.regularPrice && product.salePrice) {
                discount = Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100);
              } else if (product.originalPrice && product.price) {
                discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
              }
              return { ...product, discount };
            })
            .sort((a, b) => b.discount - a.discount);
          
          setProducts(sortedProducts);
        } else {
          console.error('Failed to fetch products on offer:', response.status);
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products on offer:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsOnOffer();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateDiscount = (product) => {
    if (product.regularPrice && product.salePrice) {
      return Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100);
    }
    if (product.originalPrice && product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  const getDisplayPrice = (product) => {
    return product.salePrice || product.price;
  };

  const getRegularPrice = (product) => {
    return product.regularPrice || product.originalPrice;
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-[#F9F5F6] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2937] dark:text-gray-100 mb-3 sm:mb-4">Popular Products on Offer</h2>
          </div>
          
          <div className="flex gap-2 sm:gap-4 lg:gap-6 overflow-hidden">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-[62%] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-96px)/5)] bg-white dark:bg-gray-800 rounded-xl border border-[#F1E8EC] dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-[#F9F5F6] dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-4 bg-[#F3E8EE] dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#F3E8EE] dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-[#F3E8EE] dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no products on offer
  }

  return (
    <section 
      className="py-12 sm:py-16 bg-[#F9F5F6] dark:bg-gray-900"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2937] dark:text-gray-100 mb-3 sm:mb-4 relative">
            Popular Products on Offer
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 sm:w-24 h-1 bg-[#881337] rounded-full"></div>
          </h2>
        </div>
        
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          {/* Left Navigation Arrow */}
          <button
            type="button"
            onClick={() => scrollSlider('left')}
            aria-label="Scroll left"
            disabled={!canScrollLeft}
            className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-[#F1E8EC] dark:border-gray-700 shadow-md hover:shadow-lg text-[#1F2937] dark:text-gray-200 hover:text-[#881337] hover:border-[#FBCFE8] transition-all duration-200 absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 ${
              canScrollLeft ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Navigation Arrow */}
          <button
            type="button"
            onClick={() => scrollSlider('right')}
            aria-label="Scroll right"
            disabled={!canScrollRight}
            className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-[#F1E8EC] dark:border-gray-700 shadow-md hover:shadow-lg text-[#1F2937] dark:text-gray-200 hover:text-[#881337] hover:border-[#FBCFE8] transition-all duration-200 absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 ${
              canScrollRight ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            ref={sliderRef}
            onScroll={updateScrollButtons}
            className="flex gap-2 sm:gap-4 lg:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
          {products.map((product) => {
            const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
            const imageUrl = primaryImage?.url || '/slider/1.webp';
            const discount = calculateDiscount(product);
            const displayPrice = getDisplayPrice(product);
            const regularPrice = getRegularPrice(product);
            
            return (
              <div
                key={product._id}
                className="flex-shrink-0 snap-start w-[62%] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-96px)/5)] group bg-white dark:bg-gray-800 rounded-xl border border-[#F1E8EC] dark:border-gray-700 hover:border-[#FBCFE8] dark:hover:border-[#9D174D]/50 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Product Image Container with white background */}
                <div 
                  className="relative w-full h-32 sm:h-40 lg:h-40 overflow-hidden bg-white"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <Link href={`/shop/${product._id}`}>
                    <Image
                      src={imageUrl}
                      alt={primaryImage?.alt || product.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      style={{
                        userSelect: 'none',
                        WebkitUserDrag: 'none',
                        WebkitUserSelect: 'none',
                        pointerEvents: 'none',
                        touchAction: 'none'
                      }}
                    />
                  </Link>
                  {/* Discount Badge - warm champagne gold top-right */}
                  {discount > 0 && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-2.5 py-1.5 text-xs sm:text-sm font-bold bg-[#B08968] text-white rounded-full shadow-sm">
                        {discount}% OFF
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-2 sm:p-3 lg:p-3">
                  {/* Product Name */}
                  <h3 className="font-semibold text-[#1F2937] dark:text-gray-100 mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-[#881337] dark:group-hover:text-[#FBCFE8] transition-colors text-xs sm:text-sm lg:text-sm min-h-[32px] sm:min-h-[36px]">
                    <Link href={`/shop/${product._id}`} className="hover:text-[#881337] dark:hover:text-[#FBCFE8] transition-colors">
                      {product.name}
                    </Link>
                  </h3>
                  
                  {/* Price and Wishlist */}
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm lg:text-sm xl:text-base font-bold text-[#1F2937] dark:text-gray-100">
                        BDT {displayPrice}
                      </span>
                      {regularPrice && regularPrice > displayPrice && (
                        <span className="text-[10px] sm:text-xs text-[#6B7280] dark:text-gray-400 line-through">
                          BDT {regularPrice}
                        </span>
                      )}
                    </div>
                    {/* Wishlist button on right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (isInWishlist(product._id)) {
                          removeFromWishlist(product._id);
                        } else {
                          addToWishlist(product);
                        }
                      }}
                      aria-label="wishlist"
                      className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-8 lg:h-8 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isInWishlist(product._id)
                          ? 'text-[#D94E67] border-[#FBCFE8] bg-[#FDF2F8] dark:bg-[#881337]/30 dark:border-[#9D174D]'
                          : 'text-[#6B7280] border-[#F1E8EC] dark:border-gray-700 hover:text-[#D94E67] hover:border-[#FBCFE8]'
                      }`}
                    >
                      <svg className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 ${isInWishlist(product._id) ? 'fill-current' : 'stroke-current'}`} fill={isInWishlist(product._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Bottom action bar - pill buttons */}
                  <div className="mt-1.5 sm:mt-2">
                    <div className="flex gap-1.5 sm:gap-2 lg:gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Check stock before adding to cart
                          if (product.inventory?.trackInventory !== false) {
                            if (product.stock === 0 || product.stock < 1) {
                              Swal.fire({
                                title: 'Out of Stock',
                                html: `
                                  <div class="text-center">
                                    <p class="mb-2 text-gray-700">
                                      <strong>${product.name}</strong> is currently out of stock.
                                    </p>
                                    <p class="text-sm text-gray-600">
                                      Please check back later or browse other products.
                                    </p>
                                  </div>
                                `,
                                icon: 'warning',
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#881337',
                                background: '#FFFDFD',
                                color: '#1f2937'
                              });
                              return;
                            }
                          }
                          
                          const result = addToCart(product);
                          
                          if (!result.success) {
                            Swal.fire({
                              title: 'Cannot Add to Cart',
                              html: `
                                <div class="text-center">
                                  <p class="mb-2 text-gray-700">
                                    ${result.message || 'Unable to add this product to cart.'}
                                  </p>
                                </div>
                              `,
                              icon: 'warning',
                              confirmButtonText: 'OK',
                              confirmButtonColor: '#881337',
                              background: '#FFFDFD',
                              color: '#1f2937'
                            });
                            return;
                          }
                          
                          Swal.fire({
                            title: 'Added to Cart!',
                            text: `${product.name} has been added to your cart`,
                            icon: 'success',
                            timer: 2000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            toast: true,
                            position: 'top-end',
                            background: '#FFFDFD',
                            color: '#1f2937'
                          });
                        }}
                        className="flex-1 py-2 sm:py-2.5 lg:py-2 rounded-full border border-[#9D174D] bg-white dark:bg-transparent text-[#881337] dark:text-[#FBCFE8] dark:border-[#D94E67] font-semibold hover:bg-[#FDF2F8] dark:hover:bg-[#881337]/20 transition-colors text-xs sm:text-sm lg:text-xs"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Check stock before adding to cart
                          if (product.inventory?.trackInventory !== false) {
                            if (product.stock === 0 || product.stock < 1) {
                              Swal.fire({
                                title: 'Out of Stock',
                                html: `
                                  <div class="text-center">
                                    <p class="mb-2 text-gray-700">
                                      <strong>${product.name}</strong> is currently out of stock.
                                    </p>
                                    <p class="text-sm text-gray-600">
                                      Please check back later or browse other products.
                                    </p>
                                  </div>
                                `,
                                icon: 'warning',
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#881337',
                                background: '#FFFDFD',
                                color: '#1f2937'
                              });
                              return;
                            }
                          }
                          
                          const result = addToCart(product);
                          
                          if (!result.success) {
                            Swal.fire({
                              title: 'Cannot Add to Cart',
                              html: `
                                <div class="text-center">
                                  <p class="mb-2 text-gray-700">
                                    ${result.message || 'Unable to add this product to cart.'}
                                  </p>
                                </div>
                              `,
                              icon: 'warning',
                              confirmButtonText: 'OK',
                              confirmButtonColor: '#881337',
                              background: '#FFFDFD',
                              color: '#1f2937'
                            });
                            return;
                          }
                          
                          router.push('/checkout');
                        }}
                        className="flex-1 py-2 sm:py-2.5 lg:py-2 rounded-full bg-[#D94E67] text-white font-semibold hover:bg-[#C43D56] transition-colors text-xs sm:text-sm lg:text-xs"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
        
        {/* View All Button */}
        <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/shop/offers"
            className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-[#881337] text-white rounded-xl hover:bg-[#6E0F2C] font-semibold text-sm sm:text-base lg:text-lg transition-all transform hover:scale-105 shadow-md"
          >
            <span>View All Offers</span>
            <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

