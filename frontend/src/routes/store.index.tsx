import { createFileRoute } from '@tanstack/react-router';
import StoreList from '@/pages/store/StoreList';
import { fetchProducts, type Product } from '@/api/saleor';
import { fetchCourses, fetchMyEnrollments } from '@/api/courses';

export type ProductWithCourseThumbnail = Product & {
  courseThumbnailUrl?: string;
  courseSlug?: string;
  isOwned?: boolean;
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

      // Create maps for course data
      const courseDataMap = new Map<string, { thumbnailUrl?: string; slug: string }>();
      for (const course of courses) {
        if (course.saleor_product_id) {
          courseDataMap.set(course.saleor_product_id, {
            thumbnailUrl: course.thumbnail_url,
            slug: course.slug,
          });
        }
      }

      // Build set of enrolled product IDs
      const enrolledProductIds = new Set<string>();
      for (const enrollment of enrollments) {
        if (enrollment.course.saleor_product_id) {
          enrolledProductIds.add(enrollment.course.saleor_product_id);
        }
      }

      // Enrich products with ownership info and thumbnails
      const enrichedProducts: ProductWithCourseThumbnail[] = products.map((product) => {
        const courseData = courseDataMap.get(product.id);
        return {
          ...product,
          courseThumbnailUrl: courseData?.thumbnailUrl,
          courseSlug: courseData?.slug,
          isOwned: enrolledProductIds.has(product.id),
        };
      });

      return { products: enrichedProducts };
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return { products: [] };
    }
  },
  component: StoreList,
});
