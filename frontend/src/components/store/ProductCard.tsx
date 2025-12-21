import { Link } from '@tanstack/react-router';
import type { Product } from '@/api/saleor';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { parseEditorJSDescription } from '@/lib/editorjs';

interface ProductCardProps {
  product: Product;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function ProductCard({ product }: ProductCardProps) {
  const price = product.pricing?.priceRange?.start?.gross;

  return (
    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 flex flex-col">
      <Link
        to="/store/$slug"
        params={{ slug: product.slug }}
        className="group flex-1"
      >
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          {product.thumbnail?.url ? (
            <img
              src={product.thumbnail.url}
              alt={product.thumbnail.alt || product.name}
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
      </Link>

      <CardFooter className="flex items-center justify-between gap-4 px-6 pt-0">
        {price && (
          <span className="text-lg font-bold text-primary">
            {formatPrice(price.amount, price.currency)}
          </span>
        )}
        <Link
          to="/store/$slug"
          params={{ slug: product.slug }}
          className="inline-flex items-center gap-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
        >
          View Course
        </Link>
      </CardFooter>
    </Card>
  );
}
