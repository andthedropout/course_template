import { useEffect, useState } from 'react';
import { fetchCourses } from '@/api/courses';

/**
 * Hook to fetch course thumbnails and provide lookup by Saleor product ID.
 * Used in cart/checkout components to display course thumbnails instead of Saleor thumbnails.
 */
export function useCourseThumbnails() {
  const [thumbnailMap, setThumbnailMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses()
      .then((courses) => {
        const map = new Map<string, string>();
        for (const course of courses) {
          if (course.saleor_product_id && course.thumbnail_url) {
            map.set(course.saleor_product_id, course.thumbnail_url);
          }
        }
        setThumbnailMap(map);
      })
      .catch((err) => {
        console.error('Failed to fetch course thumbnails:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getThumbnail = (saleorProductId: string) => thumbnailMap.get(saleorProductId);

  return { getThumbnail, isLoading };
}
