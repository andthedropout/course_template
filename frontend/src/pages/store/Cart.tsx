import { Link } from '@tanstack/react-router';
import { SEO } from '@/components/SEO';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CartItem } from '@/components/cart/CartItem';
import { useCart } from '@/hooks/useCart';

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export default function Cart() {
  const { items, itemCount, totalPrice, currency, isLoading, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <PageWrapper>
      <SEO
        title="Cart - Store"
        description="Review your cart and proceed to checkout"
        type="website"
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Cart</h1>
          <p className="text-muted-foreground">
            {itemCount === 0
              ? 'Your cart is empty'
              : `${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart`}
          </p>
        </header>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="ShoppingCart" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start shopping to add items to your cart
              </p>
              <Link to="/store">
                <Button>
                  <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Cart Items</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-destructive hover:text-destructive"
                  >
                    Clear Cart
                  </Button>
                </CardHeader>
                <CardContent>
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      isLoading={isLoading}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(totalPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice, currency)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Link to="/checkout" className="w-full">
                    <Button size="lg" className="w-full">
                      Proceed to Checkout
                      <Icon name="ArrowRight" className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/store" className="w-full">
                    <Button variant="outline" size="lg" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
