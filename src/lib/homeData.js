import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import SliderImage from '@/models/SliderImage';
import Category from '@/models/Category';
import Brand from '@/models/Brand';
import Product from '@/models/Product';
import Blog from '@/models/Blog';

const PRODUCT_CARD_PROJECTION =
  '_id name sku productCode price regularPrice salePrice originalPrice offerPrice offerPercentage discountPercentage images brand category subcategory stock lowStockThreshold status isFeatured featuredSortOrder isOfferProduct isOnSale freeDelivery taxPercentage shippingCharges inventory rating soldCount createdAt';

async function fetchHomePageDataUncached() {
  try {
    await dbConnect();

    const [
      primarySliders,
      secondarySliders,
      featuredCategories,
      featuredBrands,
      featuredProducts,
      rawOfferProducts,
      featuredBlogsRaw,
    ] = await Promise.all([
      SliderImage.find({
        status: 'active',
        $or: [
          { placement: 'primary' },
          { placement: 'both' },
          { placement: { $exists: false } },
          { placement: null },
        ],
      })
        .select('image title description buttonText buttonLink status sortOrder placement')
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean(),

      SliderImage.find({
        status: 'active',
        $or: [{ placement: 'secondary' }, { placement: 'both' }],
      })
        .select('image title description buttonText buttonLink status sortOrder placement')
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean(),

      Category.find({ status: 'active', parent: null, isFeatured: true })
        .select('_id name slug icon image isFeatured')
        .sort({ sortOrder: 1, name: 1 })
        .lean(),

      Brand.find({ status: 'active', isFeatured: true })
        .select('_id name slug logo isFeatured')
        .sort({ sortOrder: 1, name: 1 })
        .lean(),

      Product.find({ status: 'active', isFeatured: true })
        .select(PRODUCT_CARD_PROJECTION)
        .sort({ featuredSortOrder: 1, createdAt: -1 })
        .limit(20)
        .populate('brand', 'name slug logo')
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .lean(),

      Product.find({ status: 'active', isOfferProduct: true })
        .select(PRODUCT_CARD_PROJECTION)
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('brand', 'name slug logo')
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .lean(),

      Blog.find({ status: 'published', isFeatured: true })
        .sort({ sortOrder: 1, publishDate: -1 })
        .limit(4)
        .populate('author', 'name email')
        .select('title slug excerpt featuredImage publishDate author views tags categories sortOrder')
        .lean(),
    ]);

    // Fallback to latest published blogs if none are marked featured
    let featuredBlogs = featuredBlogsRaw;
    if (!featuredBlogs || featuredBlogs.length === 0) {
      featuredBlogs = await Blog.find({ status: 'published' })
        .sort({ sortOrder: 1, publishDate: -1 })
        .limit(4)
        .populate('author', 'name email')
        .select('title slug excerpt featuredImage publishDate author views tags categories sortOrder')
        .lean();
    }

    // Sort offer products by highest discount percentage (matches PopularProductsOnOffer)
    const offerProducts = rawOfferProducts
      .map((product) => {
        let discount = 0;
        if (product.regularPrice && product.salePrice) {
          discount = Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100);
        } else if (product.originalPrice && product.price) {
          discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        }
        return { ...product, discount };
      })
      .sort((a, b) => b.discount - a.discount);

    // Serialize ObjectIds and Dates cleanly for Client Component props
    return JSON.parse(
      JSON.stringify({
        primarySliders,
        secondarySliders,
        featuredCategories,
        featuredBrands,
        featuredProducts,
        offerProducts,
        featuredBlogs,
      })
    );
  } catch (error) {
    console.error('Error fetching homepage server data:', error);
    return null;
  }
}

export const getHomePageData = unstable_cache(
  fetchHomePageDataUncached,
  ['looklify-homepage-data'],
  {
    revalidate: 60,
    tags: ['homepage'],
  }
);
