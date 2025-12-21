import { createFileRoute } from '@tanstack/react-router';
import Cart from '@/pages/store/Cart';

export const Route = createFileRoute('/cart')({
  component: Cart,
});
