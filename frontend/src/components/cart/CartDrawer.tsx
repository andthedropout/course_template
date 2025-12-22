import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useCart } from '@/hooks/useCart';
import { useCourseThumbnails } from '@/hooks/useCourseThumbnails';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import type { CheckoutLine } from '@/api/saleor';

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

interface CartItemMiniProps {
  item: CheckoutLine;
  onRemove: (lineId: string) => void;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  isLoading?: boolean;
  courseThumbnailUrl?: string;
}

function CartItemMini({ item, onRemove, onUpdateQuantity, isLoading, courseThumbnailUrl }: CartItemMiniProps) {
  const product = item.variant.product;
  const price = item.totalPrice.gross;
  // Prefer course thumbnail over Saleor thumbnail
  const thumbnailUrl = courseThumbnailUrl || product.thumbnail?.url;

  return (
    <div className="flex gap-3 py-4 border-b last:border-b-0">
      <Link
        to="/store/$slug"
        params={{ slug: product.slug }}
        className="shrink-0"
      >
        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
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

      <div className="flex-1 min-w-0">
        <Link
          to="/store/$slug"
          params={{ slug: product.slug }}
          className="hover:text-primary transition-colors"
        >
          <h4 className="font-medium text-sm truncate">{product.name}</h4>
        </Link>
        <p className="text-sm font-semibold mt-1">
          {formatPrice(price.amount, price.currency)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-0 mt-2">
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={isLoading}
            className="h-9 w-9 flex items-center justify-center rounded-l-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Icon name="Trash2" className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="h-9 w-10 flex items-center justify-center border-y border-border bg-background text-sm font-medium">
            {item.quantity}
          </div>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isLoading}
            className="h-9 w-9 flex items-center justify-center rounded-r-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Icon name="Plus" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { items, itemCount, totalPrice, currency, removeItem, updateQuantity, isLoading } = useCart();
  const { getThumbnail } = useCourseThumbnails();
  const [open, setOpen] = useState(false);

  // Listen for cartOpen event to open the drawer
  useEffect(() => {
    const handleCartOpen = () => setOpen(true);
    window.addEventListener('cartOpen', handleCartOpen);
    return () => window.removeEventListener('cartOpen', handleCartOpen);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Icon name="ShoppingCart" className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon name="ShoppingCart" className="h-5 w-5" />
            Your Cart
            {itemCount > 0 && (
              <span className="text-muted-foreground font-normal">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Icon name="ShoppingBag" className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Browse our courses and add something to your cart.
            </p>
            <SheetClose asChild>
              <Button asChild>
                <Link to="/store">
                  Continue Shopping
                </Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
              {items.map((item) => (
                <CartItemMini
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onUpdateQuantity={updateQuantity}
                  isLoading={isLoading}
                  courseThumbnailUrl={getThumbnail(item.variant.product.id)}
                />
              ))}
            </div>

            <SheetFooter className="flex-col gap-4 border-t pt-4 sm:flex-col">
              <div className="flex items-center justify-between w-full">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold">
                  {formatPrice(totalPrice, currency)}
                </span>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full h-14 text-base">
                    <Link to="/checkout">
                      Checkout
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
