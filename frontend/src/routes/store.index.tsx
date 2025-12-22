import { createFileRoute } from '@tanstack/react-router';
import StoreList from '@/pages/store/StoreList';
import { fetchProducts, type Product } from '@/api/saleor';
import { fetchCourses, fetchMyEnrollments } from '@/api/courses';

export type ProductWithCourseThumbnail = Product & {
  courseThumbnailUrl?: string;
};

export const Route = createFileRoute('/store/')({
  ssr: true,
  loader: async () => {
    try {
      // Fetch products, courses, and enrollments in parallel
      const [products, courses, enrollments] = await Promise.all([
        fetchProducts(),
        fetchCourses().catch(() => []),
        fetchMyEnrollments().catch(() => []), // Fails silently if not auth'd
      ]);

      // Create a map of saleor_product_id → course.thumbnail_url
      const courseThumbnailMap = new Map<string, string>();
      for (const course of courses) {
        if (course.saleor_product_id && course.thumbnail_url) {
          courseThumbnailMap.set(course.saleor_product_id, course.thumbnail_url);
        }
      }

      // Build set of enrolled product IDs to filter out
      const enrolledProductIds = new Set<string>();
      for (const enrollment of enrollments) {
        if (enrollment.course.saleor_product_id) {
          enrolledProductIds.add(enrollment.course.saleor_product_id);
        }
      }

      // Filter out enrolled courses and enrich with thumbnails
      const enrichedProducts: ProductWithCourseThumbnail[] = products
        .filter((product) => !enrolledProductIds.has(product.id))
        .map((product) => ({
          ...product,
          courseThumbnailUrl: courseThumbnailMap.get(product.id),
        }));

      return { products: enrichedProducts };
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return { products: [] };
    }
  },
  component: StoreList,
});
