import { Icon } from '@/components/ui/icon';

export function TrustBadges() {
  return (
    <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
      <div className="flex items-center gap-1.5">
        <Icon name="Lock" className="h-3.5 w-3.5" />
        <span>Secure checkout</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Icon name="Shield" className="h-3.5 w-3.5" />
        <span>SSL encrypted</span>
      </div>
    </div>
  );
}
