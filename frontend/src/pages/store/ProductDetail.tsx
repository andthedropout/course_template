import { useLoaderData, Link, useNavigate } from '@tanstack/react-router';
import { SEO } from '@/components/SEO';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { parseEditorJSDescription } from '@/lib/editorjs';
import { createCheckout } from '@/api/saleor';
import { setCheckoutId } from '@/lib/saleor';
import type { ProductWithCourseThumbnail } from '@/routes/store.$slug';

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export default function ProductDetail() {
  const { product } = useLoaderData({ from: '/store/$slug' }) as { product: ProductWithCourseThumbnail | null };
  const { addToCart, isLoading } = useCart();
  const navigate = useNavigate();
  const [addedToCart, setAddedToCart] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Prefer course thumbnail over Saleor thumbnail
  const thumbnailUrl = product?.courseThumbnailUrl || product?.thumbnail?.url;

  if (!product) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 py-12 max-w-7xl text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/store" className="text-primary hover:underline">
            Back to store
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const price = product.pricing?.priceRange?.start?.gross;
  const variant = product.variants?.[0];

  const handleAddToCart = async () => {
    if (!variant) return;

    try {
      await addToCart(variant.id, 1);
      setAddedToCart(true);
      // Open the cart drawer
      window.dispatchEvent(new Event('cartOpen'));
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleBuyNow = async () => {
    if (!variant) return;

    setIsBuying(true);
    try {
      const checkout = await createCheckout([{ variantId: variant.id, quantity: 1 }]);
      setCheckoutId(checkout.id);
    } catch (error) {
      console.error('Failed to buy now:', error);
      setIsBuying(false);
      return;
    }
    // Navigate after state updates complete
    navigate({ to: '/checkout' });
  };

  return (
    <PageWrapper>
      <SEO
        title={`${product.name} - Store`}
        description={parseEditorJSDescription(product.description).slice(0, 160) || `Learn more about ${product.name}`}
        type="product"
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link to="/store" className="hover:text-foreground transition-colors">
                Store
              </Link>
            </li>
            <li>
              <Icon name="ChevronRight" className="h-4 w-4" />
            </li>
            <li className="text-foreground font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-video lg:aspect-square rounded-lg overflow-hidden bg-muted">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={product.thumbnail?.alt || product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{product.name}</h1>

            {price && (
              <div className="text-3xl font-bold text-primary mb-6">
                {formatPrice(price.amount, price.currency)}
              </div>
            )}

            {product.description && (
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {parseEditorJSDescription(product.description)}
              </p>
            )}

            {/* Purchase Buttons */}
            <div className="mt-auto space-y-3">
              {variant ? (
                <>
                  <Button
                    size="lg"
                    className="w-full h-14 text-base"
                    onClick={handleBuyNow}
                    disabled={isBuying}
                  >
                    {isBuying ? (
                      <>
                        <Icon name="Loader2" className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Buy Now'
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12"
                    onClick={handleAddToCart}
                    disabled={isLoading || addedToCart}
                  >
                    {isLoading ? (
                      <>
                        <Icon name="Loader2" className="h-5 w-5 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : addedToCart ? (
                      <>
                        <Icon name="Check" className="h-5 w-5 mr-2" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <Icon name="ShoppingCart" className="h-5 w-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  Unavailable
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
