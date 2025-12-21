import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@/components/ui/icon';
import { type UserAddress, fetchAddresses } from '@/api/addresses';

interface SavedAddressSelectorProps {
  selectedAddressId: number | null;
  onAddressSelect: (address: UserAddress | null) => void;
  onUseNewAddress: () => void;
  isAuthenticated: boolean;
}

export function SavedAddressSelector({
  selectedAddressId,
  onAddressSelect,
  onUseNewAddress,
  isAuthenticated,
}: SavedAddressSelectorProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    fetchAddresses()
      .then((data) => {
        setAddresses(data);
        // Auto-select default address if no address is currently selected
        if (selectedAddressId === null && data.length > 0) {
          const defaultAddress = data.find((addr) => addr.is_default) || data[0];
          onAddressSelect(defaultAddress);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch addresses:', err);
        setError('Failed to load saved addresses');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthenticated]);

  // Don't show if not authenticated or no addresses
  if (!isAuthenticated || (!isLoading && addresses.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Icon name="Loader2" className="h-4 w-4 animate-spin" />
        Loading saved addresses...
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

  const formatAddressDisplay = (addr: UserAddress) => {
    const parts = [];
    if (addr.label) {
      parts.push(`${addr.label}: `);
    }
    parts.push(`${addr.first_name} ${addr.last_name}, `);
    parts.push(`${addr.street_address}, ${addr.city}`);
    if (addr.is_default) {
      parts.push(' (Default)');
    }
    return parts.join('');
  };

  const handleValueChange = (value: string) => {
    if (value === 'new') {
      onAddressSelect(null);
      onUseNewAddress();
    } else {
      const address = addresses.find((a) => a.id.toString() === value);
      if (address) {
        onAddressSelect(address);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Use a saved address
      </label>
      <Select
        value={selectedAddressId?.toString() || 'new'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="h-12 w-full">
          <SelectValue placeholder="Select an address" />
        </SelectTrigger>
        <SelectContent>
          {addresses.map((address) => (
            <SelectItem key={address.id} value={address.id.toString()}>
              <div className="flex items-center gap-2">
                {address.is_default && (
                  <Icon name="Star" className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
                <span className="truncate">{formatAddressDisplay(address)}</span>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="new">
            <div className="flex items-center gap-2">
              <Icon name="Plus" className="h-4 w-4" />
              <span>Enter a new address</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
