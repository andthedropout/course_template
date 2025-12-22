import { useState, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { SEO } from '@/components/SEO';
import { CheckoutLayout } from '@/components/layout/CheckoutLayout';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { MobileOrderSummary } from '@/components/checkout/MobileOrderSummary';
import { TrustBadges } from '@/components/checkout/TrustBadges';
import { StripeProvider } from '@/components/checkout/StripeProvider';
import { StripePaymentForm } from '@/components/checkout/StripePaymentForm';
import { SavedAddressSelector } from '@/components/checkout/SavedAddressSelector';
import { SavedPaymentMethodSelector } from '@/components/checkout/SavedPaymentMethodSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import {
  updateCheckoutEmail,
  updateBillingAddress,
  transactionInitialize,
  transactionProcess,
  completeCheckout,
  type Order,
} from '@/api/saleor';
import { type StoredPaymentMethod } from '@/api/saleor/queries';
import { createAddress, type UserAddress } from '@/api/addresses';
import { getCheckoutId } from '@/lib/saleor';

export default function Checkout() {
  const { checkout, items, totalPrice, currency, clearCart, isLoading: isCartLoading } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Email state - pre-fill from user if authenticated
  const [email, setEmail] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Billing address state
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('US');
  const [addressLabel, setAddressLabel] = useState('');

  // Payment method state
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<StoredPaymentMethod | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentInitError, setPaymentInitError] = useState<string | null>(null);
  const paymentInitAttemptedRef = useRef(false);

  // Pre-fill email from user when authenticated
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user?.email && !email) {
      setEmail(user.email);
    }
  }, [isAuthLoading, isAuthenticated, user, email]);

  // Pre-fill email from checkout if available
  useEffect(() => {
    if (checkout?.email && !email) {
      setEmail(checkout.email);
    }
  }, [checkout, email]);

  // Initialize payment when checkout is ready
  useEffect(() => {
    const initializePayment = async () => {
      const checkoutId = getCheckoutId();
      if (!checkoutId || !totalPrice || clientSecret) return;

      // Prevent duplicate initialization (especially in React StrictMode)
      if (paymentInitAttemptedRef.current) {
        return;
      }
      paymentInitAttemptedRef.current = true;

      setIsInitializingPayment(true);
      try {
        const result = await transactionInitialize(checkoutId, totalPrice);
        setClientSecret(result.clientSecret);
        setTransactionId(result.transactionId);
      } catch (err) {
        console.error('Failed to initialize payment:', err);
        // Store error but don't show to user yet - they can still fill out form
        setPaymentInitError(err instanceof Error ? err.message : 'Payment initialization failed');
      } finally {
        setIsInitializingPayment(false);
      }
    };

    if (!isCartLoading && items.length > 0 && !paymentInitAttemptedRef.current) {
      initializePayment();
    }
  }, [isCartLoading, items.length, totalPrice, clientSecret]);

  // Handle saved address selection
  const handleAddressSelect = (addr: UserAddress | null) => {
    setSelectedAddress(addr);
    setSelectedAddressId(addr?.id || null);
    if (addr) {
      setShowAddressForm(false);
      // Pre-fill form with selected address for submission
      setFirstName(addr.first_name);
      setLastName(addr.last_name);
      setAddress(addr.street_address);
      setCity(addr.city);
      setState(addr.state);
      setPostalCode(addr.postal_code);
      setCountry(addr.country);
    }
  };

  // Handle showing new address form
  const handleUseNewAddress = () => {
    setShowAddressForm(true);
    setSelectedAddressId(null);
    setSelectedAddress(null);
    // Clear form
    setFirstName('');
    setLastName('');
    setAddress('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('US');
  };

  // Handle saved payment method selection
  const handlePaymentMethodSelect = (method: StoredPaymentMethod | null) => {
    setSelectedPaymentMethod(method);
    setSelectedPaymentMethodId(method?.id || null);
    if (method) {
      setShowPaymentForm(false);
    }
  };

  // Handle showing new payment form
  const handleUseNewPaymentMethod = () => {
    setShowPaymentForm(true);
  };

  // Check if form is valid
  const isFormValid = () => {
    if (!email) return false;
    if (!firstName || !lastName || !address || !city || !postalCode) return false;
    // Need either a saved payment method or the payment form visible
    if (!selectedPaymentMethodId && !showPaymentForm) return false;
    return true;
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

  // Render the checkout form content
  const checkoutFormContent = (
    <CheckoutFormContent
      email={email}
      setEmail={setEmail}
      marketingOptIn={marketingOptIn}
      setMarketingOptIn={setMarketingOptIn}
      isAuthenticated={isAuthenticated}
      selectedAddressId={selectedAddressId}
      onAddressSelect={handleAddressSelect}
      onUseNewAddress={handleUseNewAddress}
      showAddressForm={showAddressForm || !isAuthenticated}
      saveAddress={saveAddress}
      setSaveAddress={setSaveAddress}
      firstName={firstName}
      setFirstName={setFirstName}
      lastName={lastName}
      setLastName={setLastName}
      address={address}
      setAddress={setAddress}
      city={city}
      setCity={setCity}
      state={state}
      setState={setState}
      postalCode={postalCode}
      setPostalCode={setPostalCode}
      country={country}
      setCountry={setCountry}
      addressLabel={addressLabel}
      setAddressLabel={setAddressLabel}
      selectedPaymentMethodId={selectedPaymentMethodId}
      onPaymentMethodSelect={handlePaymentMethodSelect}
      onUseNewPaymentMethod={handleUseNewPaymentMethod}
      showPaymentForm={showPaymentForm || !isAuthenticated}
      checkoutId={getCheckoutId()}
      error={error}
      setError={setError}
      isSubmitting={isSubmitting}
      setIsSubmitting={setIsSubmitting}
      transactionId={transactionId}
      totalPrice={totalPrice}
      currency={currency}
      onOrderComplete={(order) => {
        setCompletedOrder(order);
        clearCart();
      }}
      onSaveAddress={async () => {
        if (saveAddress && isAuthenticated) {
          try {
            await createAddress({
              label: addressLabel,
              first_name: firstName,
              last_name: lastName,
              street_address: address,
              city,
              state,
              postal_code: postalCode,
              country,
            });
          } catch (err) {
            console.error('Failed to save address:', err);
            // Don't block checkout completion for this
          }
        }
      }}
    />
  );

  return (
    <CheckoutLayout>
      <SEO
        title="Checkout"
        description="Complete your purchase"
        type="website"
      />

      <div className="grid lg:grid-cols-[1fr_1fr]">
        {/* Left Column - Checkout Form */}
        <div className="flex justify-end px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
          <div className="w-full max-w-[540px]">
            {/* Mobile Order Summary */}
            <MobileOrderSummary
              items={items}
              totalPrice={totalPrice}
              currency={currency}
            />

            {/* Wrap in StripeProvider if we have client secret */}
            {clientSecret ? (
              <StripeProvider
                clientSecret={clientSecret}
                amount={totalPrice}
                currency={currency}
              >
                {checkoutFormContent}
              </StripeProvider>
            ) : (
              <div className="space-y-6">
                {/* Show loading state while initializing payment */}
                {isInitializingPayment ? (
                  <div className="flex items-center justify-center py-8">
                    <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Preparing checkout...</span>
                  </div>
                ) : paymentInitError ? (
                  <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Icon name="AlertCircle" className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <h3 className="font-medium text-destructive">Payment System Unavailable</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          The payment system is not configured. Please contact support or try again later.
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2 font-mono">
                          {paymentInitError}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <StripeProvider amount={totalPrice} currency={currency}>
                    {checkoutFormContent}
                  </StripeProvider>
                )}
              </div>
            )}
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

// Separate component for form content that uses Stripe hooks
interface CheckoutFormContentProps {
  email: string;
  setEmail: (email: string) => void;
  marketingOptIn: boolean;
  setMarketingOptIn: (value: boolean) => void;
  isAuthenticated: boolean;
  selectedAddressId: number | null;
  onAddressSelect: (address: UserAddress | null) => void;
  onUseNewAddress: () => void;
  showAddressForm: boolean;
  saveAddress: boolean;
  setSaveAddress: (value: boolean) => void;
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  postalCode: string;
  setPostalCode: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  addressLabel: string;
  setAddressLabel: (value: string) => void;
  selectedPaymentMethodId: string | null;
  onPaymentMethodSelect: (method: StoredPaymentMethod | null) => void;
  onUseNewPaymentMethod: () => void;
  showPaymentForm: boolean;
  checkoutId: string | null;
  error: string | null;
  setError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  transactionId: string | null;
  totalPrice: number;
  currency: string;
  onOrderComplete: (order: Order) => void;
  onSaveAddress: () => Promise<void>;
}

function CheckoutFormContent({
  email,
  setEmail,
  marketingOptIn,
  setMarketingOptIn,
  isAuthenticated,
  selectedAddressId,
  onAddressSelect,
  onUseNewAddress,
  showAddressForm,
  saveAddress,
  setSaveAddress,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  address,
  setAddress,
  city,
  setCity,
  state,
  setState,
  postalCode,
  setPostalCode,
  country,
  setCountry,
  addressLabel,
  setAddressLabel,
  selectedPaymentMethodId,
  onPaymentMethodSelect,
  onUseNewPaymentMethod,
  showPaymentForm,
  checkoutId,
  error,
  setError,
  isSubmitting,
  setIsSubmitting,
  transactionId,
  onOrderComplete,
  onSaveAddress,
}: CheckoutFormContentProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkoutId) {
      setError('No checkout found');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Update email on Saleor checkout
      await updateCheckoutEmail(checkoutId, email);

      // 2. Update billing address on Saleor checkout
      await updateBillingAddress(checkoutId, {
        firstName,
        lastName,
        streetAddress1: address,
        city,
        postalCode,
        countryArea: state,
        country,
      });

      // 3. Handle payment
      if (selectedPaymentMethodId) {
        // Using saved payment method - process transaction directly
        if (!transactionId) {
          throw new Error('Transaction not initialized');
        }
        await transactionProcess(transactionId, {
          paymentMethodId: selectedPaymentMethodId,
        });
      } else {
        // Using new card - confirm with Stripe Elements
        if (!stripe || !elements) {
          throw new Error('Payment not ready');
        }

        const { error: paymentError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/success`,
          },
          redirect: 'if_required',
        });

        if (paymentError) {
          throw new Error(paymentError.message || 'Payment failed');
        }

        // Process transaction with Saleor
        if (transactionId) {
          await transactionProcess(transactionId);
        }
      }

      // 4. Complete checkout and create order
      const order = await completeCheckout(checkoutId);

      // 5. Save address if requested
      await onSaveAddress();

      // 6. Show confirmation
      onOrderComplete(order);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete checkout';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    email &&
    firstName &&
    lastName &&
    address &&
    city &&
    postalCode &&
    (selectedPaymentMethodId || showPaymentForm);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout - only show when using new payment method */}
      {showPaymentForm && (
        <StripePaymentForm
          onPaymentSuccess={() => {}}
          onPaymentError={setError}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      )}

      {showPaymentForm && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or fill out the form below
            </span>
          </div>
        </div>
      )}

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
          {isAuthenticated && (
            <p className="text-xs text-muted-foreground">
              Logged in as {email}
            </p>
          )}
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

        {/* Saved Address Selector */}
        <SavedAddressSelector
          selectedAddressId={selectedAddressId}
          onAddressSelect={onAddressSelect}
          onUseNewAddress={onUseNewAddress}
          isAuthenticated={isAuthenticated}
        />

        {/* Address Form - show if using new address or not authenticated */}
        {showAddressForm && (
          <div className="space-y-4">
            {isAuthenticated && (
              <Input
                placeholder="Address label (e.g., Home, Work)"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                className="h-12"
              />
            )}

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
              className="w-full h-12 px-3 rounded-md border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
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

            {/* Save address checkbox - only for authenticated users */}
            {isAuthenticated && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  Save this address for future purchases
                </span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-semibold">Payment</h2>

        {/* Saved Payment Method Selector */}
        <SavedPaymentMethodSelector
          checkoutId={checkoutId}
          selectedMethodId={selectedPaymentMethodId}
          onMethodSelect={onPaymentMethodSelect}
          onUseNewMethod={onUseNewPaymentMethod}
          isAuthenticated={isAuthenticated}
        />

        {/* Payment Form - show if using new card */}
        {showPaymentForm && !selectedPaymentMethodId && (
          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground mb-4">
              Enter your card details above in the Express Checkout section, or use Apple Pay / Google Pay.
            </p>
          </div>
        )}
      </div>

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
        disabled={isSubmitting || !isFormValid}
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
}
