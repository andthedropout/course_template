import { Link } from '@tanstack/react-router';
import type { CheckoutLine } from '@/api/saleor';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

interface CartItemProps {
  item: CheckoutLine;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
  isLoading?: boolean;
  courseThumbnailUrl?: string;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function CartItem({ item, onUpdateQuantity, onRemove, isLoading, courseThumbnailUrl }: CartItemProps) {
  const product = item.variant.product;
  const price = item.totalPrice.gross;
  // Prefer course thumbnail over Saleor thumbnail
  const thumbnailUrl = courseThumbnailUrl || product.thumbnail?.url;

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Product Image */}
      <Link
        to="/store/$slug"
        params={{ slug: product.slug }}
        className="shrink-0"
      >
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={product.thumbnail?.alt || product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          to="/store/$slug"
          params={{ slug: product.slug }}
          className="hover:text-primary transition-colors"
        >
          <h3 className="font-semibold truncate">{product.name}</h3>
        </Link>
        {item.variant.name !== product.name && (
          <p className="text-sm text-muted-foreground">{item.variant.name}</p>
        )}

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={isLoading || item.quantity <= 1}
          >
            <Icon name="Minus" className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isLoading}
          >
            <Icon name="Plus" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Price & Remove */}
      <div className="flex flex-col items-end justify-between">
        <span className="font-bold">
          {formatPrice(price.amount, price.currency)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onRemove(item.id)}
          disabled={isLoading}
        >
          <Icon name="Trash2" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
