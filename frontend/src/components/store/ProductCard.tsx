import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { Product } from '@/api/saleor';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { parseEditorJSDescription } from '@/lib/editorjs';
import { useCart } from '@/hooks/useCart';

export type ProductWithCourseThumbnail = Product & {
  courseThumbnailUrl?: string;
};

interface ProductCardProps {
  product: ProductWithCourseThumbnail;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function ProductCard({ product }: ProductCardProps) {
  const price = product.pricing?.priceRange?.start?.gross;
  const variant = product.variants?.[0];
  const { addToCart, isLoading } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  // Prefer course thumbnail over Saleor thumbnail
  const thumbnailUrl = product.courseThumbnailUrl || product.thumbnail?.url;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant) return;

    setIsAdding(true);
    try {
      await addToCart(variant.id, 1);
      window.dispatchEvent(new Event('cartOpen'));
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      to="/store/$slug"
      params={{ slug: product.slug }}
      className="block group"
    >
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 flex flex-col">
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={product.thumbnail?.alt || product.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
        </div>

        <CardHeader className="px-6">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </CardHeader>

        <CardContent className="px-6 flex-1">
          {product.description && (
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {parseEditorJSDescription(product.description).slice(0, 150)}...
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-4 px-6 pt-0">
          {price && (
            <span className="text-lg font-bold text-primary">
              {formatPrice(price.amount, price.currency)}
            </span>
          )}
          {variant && (
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isLoading || isAdding}
            >
              {isAdding ? (
                <Icon name="Loader2" className="h-4 w-4 animate-spin" />
              ) : (
                'Add to Cart'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
