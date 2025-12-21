import { CalloutBlockData, CalloutVariant } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface CalloutBlockProps {
  data: CalloutBlockData;
  onChange: (data: CalloutBlockData) => void;
  isEditing?: boolean;
}

const VARIANT_CONFIG: Record<
  CalloutVariant,
  { icon: string; label: string; className: string }
> = {
  info: {
    icon: 'Info',
    label: 'Info',
    className: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100',
  },
  warning: {
    icon: 'AlertTriangle',
    label: 'Warning',
    className: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100',
  },
  tip: {
    icon: 'Lightbulb',
    label: 'Tip',
    className: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100',
  },
  danger: {
    icon: 'AlertCircle',
    label: 'Danger',
    className: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100',
  },
};

export function CalloutBlock({ data, onChange, isEditing }: CalloutBlockProps) {
  const variant = data.variant || 'info';
  const config = VARIANT_CONFIG[variant];

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
            <Select
              value={variant}
              onValueChange={(v) => onChange({ ...data, variant: v as CalloutVariant })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VARIANT_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon name={val.icon} className="h-4 w-4" />
                      {val.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="callout-title" className="text-xs font-medium text-muted-foreground">
              Title (optional)
            </Label>
            <Input
              id="callout-title"
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="Callout title"
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="callout-content" className="text-xs font-medium text-muted-foreground">Content</Label>
          <Textarea
            id="callout-content"
            value={data.content}
            onChange={(e) => onChange({ ...data, content: e.target.value })}
            placeholder="Callout content..."
            rows={3}
          />
        </div>

        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
          <CalloutPreview data={data} />
        </div>
      </div>
    );
  }

  return <CalloutPreview data={data} />;
}

function CalloutPreview({ data }: { data: CalloutBlockData }) {
  const variant = data.variant || 'info';
  const config = VARIANT_CONFIG[variant];

  return (
    <div className={cn('rounded-lg border p-4', config.className)}>
      <div className="flex gap-3">
        <Icon name={config.icon} className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {data.title && <p className="font-semibold mb-1">{data.title}</p>}
          <p className="text-sm">{data.content || 'No content'}</p>
        </div>
      </div>
    </div>
  );
}
