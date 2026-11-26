import dynamic from "next/dynamic";
import ImageSlider from "./components/ImageSlider";
import FeaturedCategories from "./components/FeaturedCategories";
import FeaturedProducts from "./components/FeaturedProducts";
import PopularProductsOnOffer from "./components/PopularProductsOnOffer";
import ImageSlider2 from "./components/ImageSlider2";
import { getHomePageData } from "@/lib/homeData";

const FeaturedBlogs = dynamic(() => import("./components/FeaturedBlogs"));
const FeaturedBrands = dynamic(() => import("./components/FeaturedBrands"));
const FeaturesSection = dynamic(() => import("./components/FeaturesSection"));

export const revalidate = 60;

export default async function Home() {
  const data = await getHomePageData();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden m-0 p-0">
      {/* Hero Section - Primary Image Slider */}
      <ImageSlider initialImages={data?.primarySliders ?? null} />

      {/* Featured Categories */}
      <FeaturedCategories initialCategories={data?.featuredCategories ?? null} />

      {/* Featured Products */}
      <FeaturedProducts initialProducts={data?.featuredProducts ?? null} />

      {/* Secondary Slider */}
      <ImageSlider2 initialImages={data?.secondarySliders ?? null} />

      {/* Popular Products on Offer */}
      <PopularProductsOnOffer initialProducts={data?.offerProducts ?? null} />

      {/* Featured Blogs */}
      <FeaturedBlogs initialBlogs={data?.featuredBlogs ?? null} />

      {/* Featured Brands */}
      <FeaturedBrands initialBrands={data?.featuredBrands ?? null} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Stats Section */}
      {/* <StatsSection /> */}
    </div>
  );
}
