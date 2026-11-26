'use client';

import { useState, useEffect } from 'react';
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

export default function FeaturedProducts({ initialProducts = null }) {
  const [featuredProducts, setFeaturedProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(initialProducts === null);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

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
    if (initialProducts !== null) return;
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?featured=true&limit=20');
        
        if (response.ok) {
          const data = await response.json();
          const products = data.data?.products || [];
          // Sort by featuredSortOrder (ascending), then by createdAt (newest first)
          const sorted = [...products].sort((a, b) => {
            const orderA = typeof a.featuredSortOrder === 'number' ? a.featuredSortOrder : 0;
            const orderB = typeof b.featuredSortOrder === 'number' ? b.featuredSortOrder : 0;
            if (orderA !== orderB) return orderA - orderB;
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setFeaturedProducts(sorted);
        } else {
          console.error('Failed to fetch featured products:', response.status, response.statusText);
          setFeaturedProducts([]);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateDiscount = (product) => {
    // New pricing structure
    if (product.regularPrice && product.salePrice) {
      return Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100);
    }
    // Legacy pricing
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
      <section className="py-16 bg-[#FFFDFD] dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1F2937] dark:text-gray-100 mb-4">Featured Products</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-[#F1E8EC] dark:border-gray-800 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-[#F9F5F6] dark:bg-gray-800"></div>
                <div className="p-4">
                  <div className="h-4 bg-[#F3E8EE] dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#F3E8EE] dark:bg-gray-800 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-[#F3E8EE] dark:bg-gray-800 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return null; // Don't show section if no featured products
  }

  return (
    <section 
      className="py-12 sm:py-16 bg-[#FFFDFD] dark:bg-gray-950"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F2937] dark:text-gray-100 mb-3 sm:mb-4 relative">
            Featured Products
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 sm:w-24 h-1 bg-[#881337] rounded-full"></div>
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
          {featuredProducts.map((product) => {
            const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
            const imageUrl = primaryImage?.url || '/slider/1.webp';
            const discount = calculateDiscount(product);
            const displayPrice = getDisplayPrice(product);
            const regularPrice = getRegularPrice(product);
            
            return (
              <div
                key={product._id}
                className="group bg-white dark:bg-gray-900 rounded-xl border border-[#F1E8EC] dark:border-gray-800 hover:border-[#FBCFE8] dark:hover:border-[#9D174D]/50 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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
        
        {/* View All Button */}
        <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/shop?featured=true"
            className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-[#881337] text-white rounded-xl hover:bg-[#6E0F2C] font-semibold text-sm sm:text-base lg:text-lg transition-all transform hover:scale-105 shadow-md"
          >
            <span>View All Featured Products</span>
            <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
