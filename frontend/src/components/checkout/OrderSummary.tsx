import type { CheckoutLine } from '@/api/saleor';
import { useCourseThumbnails } from '@/hooks/useCourseThumbnails';

interface OrderSummaryProps {
  items: CheckoutLine[];
  totalPrice: number;
  currency: string;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function OrderSummary({ items, totalPrice, currency }: OrderSummaryProps) {
  const { getThumbnail } = useCourseThumbnails();

  return (
    <div className="space-y-6">
      {/* Items */}
      <div className="space-y-4">
        {items.map((item) => {
          // Prefer course thumbnail over Saleor thumbnail
          const thumbnailUrl = getThumbnail(item.variant.product.id) || item.variant.product.thumbnail?.url;
          return (
            <div key={item.id} className="flex gap-4">
              <div className="relative w-16 h-16 rounded-lg bg-muted shrink-0 border border-border/50">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={item.variant.product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
                {/* Quantity badge */}
                <span className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-muted-foreground text-background text-xs font-medium rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.variant.product.name}</p>
                {item.variant.name !== item.variant.product.name && (
                  <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                )}
              </div>
              <p className="font-medium text-sm">
                {formatPrice(item.totalPrice.gross.amount, item.totalPrice.gross.currency)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Discount code */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Discount code"
          className="flex-1 h-10 px-3 text-sm border border-border rounded-md bg-transparent focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
        <button
          type="button"
          className="px-4 h-10 text-sm font-medium border border-border rounded-md bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
          disabled
        >
          Apply
        </button>
      </div>

      {/* Totals */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(totalPrice, currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">Free</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <span className="text-base font-medium">Total</span>
        <div className="text-right">
          <span className="text-xs text-muted-foreground mr-2">{currency}</span>
          <span className="text-xl font-semibold">{formatPrice(totalPrice, currency)}</span>
        </div>
      </div>
    </div>
  );
}
