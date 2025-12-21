import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { SEO } from '@/components/SEO';
import { CheckoutLayout } from '@/components/layout/CheckoutLayout';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { MobileOrderSummary } from '@/components/checkout/MobileOrderSummary';
import { TrustBadges } from '@/components/checkout/TrustBadges';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { ExpressCheckout } from '@/components/checkout/ExpressCheckout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { useCart } from '@/hooks/useCart';
import { updateCheckoutEmail, updateBillingAddress, createPayment, completeCheckout, type Order } from '@/api/saleor';
import { getCheckoutId } from '@/lib/saleor';

export default function Checkout() {
  const { checkout, items, totalPrice, currency, clearCart, isLoading: isCartLoading } = useCart();
  const [email, setEmail] = useState(checkout?.email || '');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Billing address state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('US');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const checkoutId = getCheckoutId();
    if (!checkoutId) {
      setError('No checkout found');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateCheckoutEmail(checkoutId, email);
      await updateBillingAddress(checkoutId, {
        firstName,
        lastName,
        streetAddress1: address,
        city,
        postalCode,
        countryArea: state,
        country,
      });
      // Create payment before completing checkout
      await createPayment(checkoutId, 'mirumee.payments.dummy', totalPrice, currency);
      const order = await completeCheckout(checkoutId);
      setCompletedOrder(order);
      clearCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete checkout';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order completed state
  if (completedOrder) {
    return (
      <CheckoutLayout>
        <SEO
          title="Order Confirmed"
          description="Your order has been placed successfully"
          type="website"
        />

        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
              <Icon name="Check" className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Thank you for your order!</h1>
            <p className="text-muted-foreground mb-2">
              Order #{completedOrder.number}
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              We've sent a confirmation email to <strong>{email}</strong>
            </p>
            <Link to="/store">
              <Button size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </CheckoutLayout>
    );
  }

  // Loading state - show nothing while cart loads to prevent flash
  if (isCartLoading || (!checkout && getCheckoutId())) {
    return (
      <CheckoutLayout>
        <div className="min-h-screen" />
      </CheckoutLayout>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <CheckoutLayout>
        <SEO
          title="Checkout"
          description="Complete your purchase"
          type="website"
        />

        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center">
            <Icon name="ShoppingCart" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some items to your cart before checking out
            </p>
            <Link to="/store">
              <Button size="lg">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </CheckoutLayout>
    );
  }

  const checkoutForm = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout */}
      <ExpressCheckout />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or
          </span>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>

        <div className="space-y-2">
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-muted-foreground">
            Email me with news and offers
          </span>
        </label>
      </div>

      {/* Billing Address */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-semibold">Billing address</h2>

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="h-12"
          />
          <Input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="h-12"
          />
        </div>

        <Input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="h-12"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="h-12"
          />
          <Input
            placeholder="State / Province"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            className="h-12"
          />
        </div>

        <Input
          placeholder="ZIP / Postal code"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          required
          className="h-12"
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full h-12 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="ES">Spain</option>
          <option value="IT">Italy</option>
          <option value="NL">Netherlands</option>
          <option value="BR">Brazil</option>
          <option value="MX">Mexico</option>
          <option value="JP">Japan</option>
          <option value="IN">India</option>
          <option value="SG">Singapore</option>
        </select>
      </div>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
      />

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-base"
        disabled={isSubmitting || !email || !firstName || !lastName || !address || !city || !state || !postalCode}
      >
        {isSubmitting ? (
          <>
            <Icon name="Loader2" className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete order'
        )}
      </Button>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Return to cart */}
      <div className="pt-4">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Icon name="ChevronLeft" className="h-4 w-4" />
          Return to cart
        </Link>
      </div>
    </form>
  );

  return (
    <CheckoutLayout>
      <SEO
        title="Checkout"
        description="Complete your purchase"
        type="website"
      />

      <div className="grid lg:grid-cols-[1fr,1fr]">
        {/* Left Column - Checkout Form */}
        <div className="flex justify-end px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
          <div className="w-full max-w-[540px]">
            {/* Mobile Order Summary */}
            <MobileOrderSummary
              items={items}
              totalPrice={totalPrice}
              currency={currency}
            />

            {checkoutForm}
          </div>
        </div>

        {/* Right Column - Order Summary (Desktop) */}
        <div className="hidden lg:flex justify-start bg-muted/30 border-l border-border px-12 py-12">
          <div className="w-full max-w-[400px]">
            <OrderSummary
              items={items}
              totalPrice={totalPrice}
              currency={currency}
            />
          </div>
        </div>
      </div>
    </CheckoutLayout>
  );
}
