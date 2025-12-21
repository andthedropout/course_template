import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { type StoredPaymentMethod, fetchCheckoutStoredPaymentMethods } from '@/api/saleor/queries';
import { cn } from '@/lib/utils';

interface SavedPaymentMethodSelectorProps {
  checkoutId: string | null;
  selectedMethodId: string | null;
  onMethodSelect: (method: StoredPaymentMethod | null) => void;
  onUseNewMethod: () => void;
  isAuthenticated: boolean;
}

// Map card brands to icons
const CARD_BRAND_ICONS: Record<string, string> = {
  visa: 'CreditCard',
  mastercard: 'CreditCard',
  amex: 'CreditCard',
  discover: 'CreditCard',
  default: 'CreditCard',
};

export function SavedPaymentMethodSelector({
  checkoutId,
  selectedMethodId,
  onMethodSelect,
  onUseNewMethod,
  isAuthenticated,
}: SavedPaymentMethodSelectorProps) {
  const [paymentMethods, setPaymentMethods] = useState<StoredPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !checkoutId) {
      setIsLoading(false);
      return;
    }

    fetchCheckoutStoredPaymentMethods(checkoutId)
      .then((data) => {
        setPaymentMethods(data);
        // Auto-select first payment method if none selected
        if (selectedMethodId === null && data.length > 0) {
          onMethodSelect(data[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch payment methods:', err);
        setError('Failed to load saved payment methods');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthenticated, checkoutId]);

  // Don't show if not authenticated or no payment methods
  if (!isAuthenticated || (!isLoading && paymentMethods.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Icon name="Loader2" className="h-4 w-4 animate-spin" />
        Loading saved payment methods...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive py-2">
        {error}
      </div>
    );
  }

  const formatCardBrand = (brand?: string) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const getCardIcon = (brand?: string) => {
    return CARD_BRAND_ICONS[brand?.toLowerCase() || 'default'] || CARD_BRAND_ICONS.default;
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Saved payment methods
      </label>

      <div className="space-y-2">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onMethodSelect(method)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left',
              selectedMethodId === method.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            )}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
              <Icon name={getCardIcon(method.data?.brand)} className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {formatCardBrand(method.data?.brand)} ending in {method.data?.lastDigits || '****'}
              </div>
              {method.data?.expMonth && method.data?.expYear && (
                <div className="text-sm text-muted-foreground">
                  Expires {method.data.expMonth.toString().padStart(2, '0')}/{method.data.expYear.toString().slice(-2)}
                </div>
              )}
            </div>
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              selectedMethodId === method.id
                ? 'border-primary'
                : 'border-muted-foreground/30'
            )}>
              {selectedMethodId === method.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
          </button>
        ))}

        {/* Use new card option */}
        <button
          type="button"
          onClick={() => {
            onMethodSelect(null);
            onUseNewMethod();
          }}
          className={cn(
            'w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left',
            selectedMethodId === null
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50'
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
            <Icon name="Plus" className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">
              Use a new card
            </div>
            <div className="text-sm text-muted-foreground">
              Enter new payment details
            </div>
          </div>
          <div className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            selectedMethodId === null
              ? 'border-primary'
              : 'border-muted-foreground/30'
          )}>
            {selectedMethodId === null && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
