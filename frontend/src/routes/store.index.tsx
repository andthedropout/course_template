import { createFileRoute } from '@tanstack/react-router';
import StoreList from '@/pages/store/StoreList';
import { fetchProducts } from '@/api/saleor';

export const Route = createFileRoute('/store/')({
  ssr: true,
  loader: async () => {
    try {
      const products = await fetchProducts();
      return { products };
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return { products: [] };
    }
  },
  component: StoreList,
});
