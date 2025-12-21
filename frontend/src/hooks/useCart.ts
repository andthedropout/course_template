import { useState, useEffect, useCallback } from 'react';
import { getCheckoutId, setCheckoutId, clearCheckoutId } from '@/lib/saleor';
import {
  fetchCheckout,
  createCheckout,
  addToCheckout,
  updateCheckoutLine,
  removeCheckoutLine,
  type Checkout,
  type CheckoutLine,
} from '@/api/saleor';

interface UseCartReturn {
  checkout: Checkout | null;
  items: CheckoutLine[];
  itemCount: number;
  totalPrice: number;
  currency: string;
  isLoading: boolean;
  error: string | null;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

export function useCart(): UseCartReturn {
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load checkout on mount
  useEffect(() => {
    const loadCheckout = async () => {
      const checkoutId = getCheckoutId();
      if (!checkoutId) return;

      try {
        setIsLoading(true);
        const existingCheckout = await fetchCheckout(checkoutId);
        if (existingCheckout) {
          setCheckout(existingCheckout);
        } else {
          // Checkout no longer exists, clear the stored ID
          clearCheckoutId();
        }
      } catch (err) {
        console.error('Failed to load checkout:', err);
        clearCheckoutId();
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckout();

    // Listen for cart updates from other components/tabs
    const handleCartChange = () => loadCheckout();
    window.addEventListener('cartChange', handleCartChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'saleor_checkout_id') handleCartChange();
    });

    return () => {
      window.removeEventListener('cartChange', handleCartChange);
    };
  }, []);

  const refreshCart = useCallback(async () => {
    const checkoutId = getCheckoutId();
    if (!checkoutId) {
      setCheckout(null);
      return;
    }

    try {
      const existingCheckout = await fetchCheckout(checkoutId);
      setCheckout(existingCheckout);
    } catch (err) {
      console.error('Failed to refresh checkout:', err);
    }
  }, []);

  const addToCart = useCallback(async (variantId: string, quantity: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const checkoutId = getCheckoutId();
      let updatedCheckout: Checkout;

      if (checkoutId) {
        // Add to existing checkout
        updatedCheckout = await addToCheckout(checkoutId, [{ variantId, quantity }]);
      } else {
        // Create new checkout
        updatedCheckout = await createCheckout([{ variantId, quantity }]);
        setCheckoutId(updatedCheckout.id);
      }

      setCheckout(updatedCheckout);
      window.dispatchEvent(new Event('cartChange'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    const checkoutId = getCheckoutId();
    if (!checkoutId) return;

    setIsLoading(true);
    setError(null);

    try {
      if (quantity <= 0) {
        // Remove the item if quantity is 0 or less
        const updatedCheckout = await removeCheckoutLine(checkoutId, lineId);
        setCheckout(updatedCheckout);
      } else {
        const updatedCheckout = await updateCheckoutLine(checkoutId, lineId, quantity);
        setCheckout(updatedCheckout);
      }
      window.dispatchEvent(new Event('cartChange'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update quantity';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (lineId: string) => {
    const checkoutId = getCheckoutId();
    if (!checkoutId) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedCheckout = await removeCheckoutLine(checkoutId, lineId);
      setCheckout(updatedCheckout);
      window.dispatchEvent(new Event('cartChange'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => {
    clearCheckoutId();
    setCheckout(null);
    window.dispatchEvent(new Event('cartChange'));
  }, []);

  const items = checkout?.lines || [];
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = checkout?.totalPrice?.gross?.amount || 0;
  const currency = checkout?.totalPrice?.gross?.currency || 'USD';

  return {
    checkout,
    items,
    itemCount,
    totalPrice,
    currency,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  };
}
