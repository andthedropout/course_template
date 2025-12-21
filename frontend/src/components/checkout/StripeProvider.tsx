import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { ReactNode } from 'react';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe outside of component to avoid recreating on every render
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
  amount: number;
  currency: string;
}

export function StripeProvider({ children, clientSecret, amount, currency }: StripeProviderProps) {
  if (!stripePromise) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
        <strong>Stripe not configured.</strong> Add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.
      </div>
    );
  }

  const options = clientSecret
    ? { clientSecret }
    : {
        mode: 'payment' as const,
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: currency.toLowerCase(),
        appearance: {
          theme: 'stripe' as const,
          variables: {
            colorPrimary: 'hsl(var(--primary))',
            borderRadius: '8px',
          },
        },
      };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

export { stripePromise };
