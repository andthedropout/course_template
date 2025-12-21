import { Icon } from '@/components/ui/icon';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

export function PaymentMethodSelector({ selectedMethod, onMethodChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Payment</h2>
        <p className="text-sm text-muted-foreground mt-1">All transactions are secure and encrypted.</p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {/* Credit Card Option */}
        <label
          className={`flex items-center justify-between p-4 cursor-pointer border-b border-border ${
            selectedMethod === 'card' ? 'bg-primary/5' : 'bg-background'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="payment-method"
              value="card"
              checked={selectedMethod === 'card'}
              onChange={() => onMethodChange('card')}
              className="w-5 h-5 text-primary border-2 border-muted-foreground focus:ring-primary"
            />
            <span className="font-medium">Credit or debit card</span>
          </div>
          <Icon name="CreditCard" className="h-5 w-5 text-muted-foreground" />
        </label>

        {/* Card Form - shown when card is selected */}
        {selectedMethod === 'card' && (
          <div className="p-4 bg-muted/30 space-y-3 border-b border-border">
            <div className="relative">
              <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-muted-foreground text-sm">
                Card number
              </div>
              <Icon name="Lock" className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-muted-foreground text-sm">
                Expiration date (MM / YY)
              </div>
              <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-muted-foreground text-sm">
                Security code
              </div>
            </div>
            <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-muted-foreground text-sm">
              Name on card
            </div>
          </div>
        )}

        {/* PayPal Option */}
        <label
          className={`flex items-center justify-between p-4 cursor-pointer ${
            selectedMethod === 'paypal' ? 'bg-primary/5' : 'bg-background'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="payment-method"
              value="paypal"
              checked={selectedMethod === 'paypal'}
              onChange={() => onMethodChange('paypal')}
              className="w-5 h-5 text-primary border-2 border-muted-foreground focus:ring-primary"
            />
            <span className="font-medium">PayPal</span>
          </div>
        </label>

        {/* PayPal redirect message */}
        {selectedMethod === 'paypal' && (
          <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
            After clicking "Complete order", you will be redirected to PayPal to complete your purchase securely.
          </div>
        )}
      </div>
    </div>
  );
}
