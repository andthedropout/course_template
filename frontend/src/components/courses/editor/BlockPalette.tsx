import { useDraggable } from '@dnd-kit/core';
import { BLOCK_TYPES, BlockType } from './types';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
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
        'flex flex-col items-center gap-2 p-3 rounded-xl text-center',
        'bg-background border border-border/50 shadow-sm',
        'hover:border-primary/50 hover:shadow-md hover:scale-[1.02]',
        'transition-all duration-150 cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-95'
      )}
      title={description}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
        <Icon name={icon} className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs font-medium text-foreground/80">{label}</span>
    </button>
  );
}
