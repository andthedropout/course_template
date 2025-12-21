import { useDraggable } from '@dnd-kit/core';
import { BLOCK_TYPES, BlockType } from './types';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-2">Blocks</h3>
      <div className="space-y-1">
        {BLOCK_TYPES.map((block) => (
          <DraggableBlockItem
            key={block.type}
            type={block.type}
            label={block.label}
            icon={block.icon}
            description={block.description}
            onAddBlock={onAddBlock}
          />
        ))}
      </div>
    </div>
  );
}

interface DraggableBlockItemProps {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  onAddBlock: (type: BlockType) => void;
}

function DraggableBlockItem({
  type,
  label,
  icon,
  description,
  onAddBlock,
}: DraggableBlockItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAddBlock(type)}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg text-left',
        'hover:bg-accent transition-colors cursor-grab active:cursor-grabbing',
        'border border-transparent hover:border-border',
        isDragging && 'opacity-50'
      )}
      title={description}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded bg-muted">
        <Icon name={icon} className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
