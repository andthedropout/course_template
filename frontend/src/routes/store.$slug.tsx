import { createFileRoute } from '@tanstack/react-router';
import ProductDetail from '@/pages/store/ProductDetail';
import { fetchProduct } from '@/api/saleor';

export const Route = createFileRoute('/store/$slug')({
  ssr: true,
  loader: async ({ params }) => {
    try {
      const product = await fetchProduct(params.slug);
      return { product };
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return { product: null };
    }
  },
  component: ProductDetail,
});
