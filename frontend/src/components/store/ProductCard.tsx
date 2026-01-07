import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { Product } from '@/api/saleor';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { parseEditorJSDescription } from '@/lib/editorjs';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

export type ProductWithCourseThumbnail = Product & {
  courseThumbnailUrl?: string;
  courseSlug?: string;
  isOwned?: boolean;
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
  const isOwned = product.isOwned;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant || isOwned) return;

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

  // If owned and has a course slug, link to the course player
  const linkTo = isOwned && product.courseSlug
    ? `/app/courses/${product.courseSlug}/`
    : `/store/${product.slug}`;

  return (
    <Link
      to={linkTo}
      className="block group"
    >
      <Card className={cn(
        "h-full transition-all flex flex-col",
        isOwned
          ? "opacity-60 hover:opacity-80"
          : "hover:shadow-lg hover:border-primary/50"
      )}>
        <div className="aspect-video w-full overflow-hidden rounded-t-lg relative">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={product.thumbnail?.alt || product.name}
              className={cn(
                "w-full h-full object-cover transition-transform",
                !isOwned && "group-hover:scale-105",
                isOwned && "grayscale-[30%]"
              )}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
          {isOwned && (
            <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border">
              <Icon name="CheckCircle2" className="h-3 w-3 mr-1" />
              Purchased
            </Badge>
          )}
        </div>

        <CardHeader className="px-6">
          <h3 className={cn(
            "text-xl font-bold mb-2 transition-colors",
            !isOwned && "group-hover:text-primary"
          )}>
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
          {isOwned ? (
            <>
              <span className="text-sm text-muted-foreground">Already owned</span>
              <Button size="sm" variant="outline">
                <Icon name="Play" className="h-4 w-4 mr-1" />
                Go to Course
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
