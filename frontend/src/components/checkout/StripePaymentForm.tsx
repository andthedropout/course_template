import { useState } from 'react';
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';

interface StripePaymentFormProps {
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

export function StripePaymentForm({
  onPaymentSuccess,
  onPaymentError,
  isSubmitting,
  setIsSubmitting,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [showExpressCheckout, setShowExpressCheckout] = useState(true);

  const handleExpressCheckoutConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent
  ) => {
    if (!stripe || !elements) return;

    setIsSubmitting(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      onPaymentError(error.message || 'Payment failed');
      setIsSubmitting(false);
    } else {
      onPaymentSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Express Checkout (Apple Pay, Google Pay, Link) */}
      {showExpressCheckout && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Express checkout
          </h2>
          <ExpressCheckoutElement
            onConfirm={handleExpressCheckoutConfirm}
            onReady={({ availablePaymentMethods }) => {
              // Hide if no express methods available
              if (!availablePaymentMethods) {
                setShowExpressCheckout(false);
              }
            }}
            options={{
              buttonType: {
                applePay: 'buy',
                googlePay: 'buy',
              },
            }}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or pay with card
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Card Payment */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Payment</h2>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>
    </div>
  );
}
