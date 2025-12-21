import { DividerBlockData } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DividerBlockProps {
  data: DividerBlockData;
  onChange: (data: DividerBlockData) => void;
  isEditing?: boolean;
}

export function DividerBlock({ data, onChange, isEditing }: DividerBlockProps) {
  const style = data.style || 'line';

  if (isEditing) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Style:</span>
          <Select
            value={style}
            onValueChange={(value) =>
              onChange({ ...data, style: value as 'line' | 'dots' | 'space' })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="dots">Dots</SelectItem>
              <SelectItem value="space">Space</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4">
          <DividerPreview style={style} />
        </div>
      </div>
    );
  }

  return <DividerPreview style={style} />;
}

function DividerPreview({ style }: { style: string }) {
  switch (style) {
    case 'dots':
      return (
        <div className="flex justify-center gap-2 py-4">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        </div>
      );
    case 'space':
      return <div className="h-8" />;
    default:
      return <hr className="border-border my-4" />;
  }
}
