import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Brand from '@/models/Brand';

// GET /api/shop/filters - get all filter options for shop page
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brand');

    // Fetch brands and all active categories (main + subcategories) in parallel
    const [brands, allCategories] = await Promise.all([
      Brand.find({ status: 'active' })
        .select('_id name slug logo isFeatured')
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      Category.find({ status: 'active' })
        .select('_id name slug icon image isFeatured parent brand sortOrder')
        .sort({ sortOrder: 1, name: 1 })
        .lean()
    ]);

    // Derive featured brands from brands array
    const featuredBrands = brands.filter(brand => brand.isFeatured);

    // Separate main categories and build lookup maps in memory (avoids extra populate round-trips)
    const categories = [];
    const categoryMap = new Map();
    for (const cat of allCategories) {
      if (!cat.parent) {
        const mainCat = {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          image: cat.image,
          isFeatured: cat.isFeatured
        };
        categories.push(mainCat);
        categoryMap.set(cat._id.toString(), {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug
        });
      }
    }

    const brandMap = new Map(
      brands.map(b => [b._id.toString(), { _id: b._id, name: b.name, slug: b.slug }])
    );

    // Derive featured categories from categories array
    const featuredCategories = categories.filter(cat => cat.isFeatured);

    // Resolve subcategories and group by parent category name
    const subcategoriesByParent = allCategories.reduce((acc, cat) => {
      if (!cat.parent) return acc;
      if (brandId && cat.brand?.toString() !== brandId) return acc;

      const parentObj = categoryMap.get(cat.parent.toString()) || null;
      const parentName = parentObj?.name || 'Other';
      const subObj = brandId
        ? { _id: cat._id, name: cat.name, slug: cat.slug, parent: parentObj }
        : {
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            parent: parentObj,
            brand: cat.brand ? brandMap.get(cat.brand.toString()) || null : null
          };

      if (!acc[parentName]) {
        acc[parentName] = [];
      }
      acc[parentName].push(subObj);
      return acc;
    }, {});

    // Static filter options (these could also be moved to database if needed)
    const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive', 'All Types'];
    const skinConcerns = ['Acne', 'Aging', 'Dark Spots', 'Dryness', 'Oiliness', 'Sensitivity', 'Uneven Skin Tone', 'Wrinkles'];

    return NextResponse.json(
      {
        success: true,
        data: {
          brands,
          featuredBrands,
          categories,
          featuredCategories,
          subcategories: subcategoriesByParent,
          skinTypes,
          skinConcerns
        }
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching shop filters:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch filter options', 
      details: error.message 
    }, { status: 500 });
  }
}
