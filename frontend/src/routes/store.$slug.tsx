import { createFileRoute } from '@tanstack/react-router';
import ProductDetail from '@/pages/store/ProductDetail';
import { fetchProduct, type Product } from '@/api/saleor';
import { fetchCourses } from '@/api/courses';

export type ProductWithCourseThumbnail = Product & {
  courseThumbnailUrl?: string;
};

export const Route = createFileRoute('/store/$slug')({
  ssr: true,
  loader: async ({ params }) => {
    try {
      // Fetch both product and courses in parallel
      const [product, courses] = await Promise.all([
        fetchProduct(params.slug),
        fetchCourses().catch(() => []),
      ]);

      if (!product) {
        return { product: null };
      }

      // Find matching course thumbnail
      const matchingCourse = courses.find(
        (course) => course.saleor_product_id === product.id
      );

      const enrichedProduct: ProductWithCourseThumbnail = {
        ...product,
        courseThumbnailUrl: matchingCourse?.thumbnail_url,
      };

      return { product: enrichedProduct };
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return { product: null };
    }
  },
  component: ProductDetail,
});
