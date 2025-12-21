import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import type { CheckoutLine } from '@/api/saleor';

interface MobileOrderSummaryProps {
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

export function MobileOrderSummary({ items, totalPrice, currency }: MobileOrderSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden border-b border-border bg-muted/30 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-primary">
          <Icon name="ShoppingCart" className="h-5 w-5" />
          <span className="text-sm font-medium">
            {isOpen ? 'Hide order summary' : 'Show order summary'}
          </span>
          <Icon
            name="ChevronDown"
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
        <span className="text-lg font-semibold">
          {formatPrice(totalPrice, currency)}
        </span>
      </button>

      {isOpen && (
        <div className="pb-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative w-14 h-14 rounded-lg bg-muted shrink-0 border border-border/50">
                {item.variant.product.thumbnail?.url ? (
                  <img
                    src={item.variant.product.thumbnail.url}
                    alt={item.variant.product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No img
                  </div>
                )}
                <span className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-muted-foreground text-background text-xs font-medium rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.variant.product.name}</p>
              </div>
              <p className="font-medium text-sm">
                {formatPrice(item.totalPrice.gross.amount, item.totalPrice.gross.currency)}
              </p>
            </div>
          ))}

          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(totalPrice, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">Free</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
