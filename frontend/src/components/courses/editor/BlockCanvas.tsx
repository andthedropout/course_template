import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LessonBlock, BlockType, createBlock, BLOCK_TYPES } from './types';
import { BlockRenderer } from './BlockRenderer';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BlockCanvasProps {
  blocks: LessonBlock[];
  onChange: (blocks: LessonBlock[]) => void;
}

export function BlockCanvas({ blocks, onChange }: BlockCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: 'canvas',
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dragging from palette
    const activeData = active.data.current;
    if (activeData?.fromPalette) {
      const newBlock = createBlock(activeData.type as BlockType);
      const overIndex = blocks.findIndex((b) => b.id === over.id);
      const insertIndex = overIndex === -1 ? blocks.length : overIndex;

      const newBlocks = [...blocks];
      newBlocks.splice(insertIndex, 0, { ...newBlock, order: insertIndex });
      onChange(reorderBlocks(newBlocks));
      setEditingBlockId(newBlock.id);
      return;
    }

    // Reordering existing blocks
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex);
        onChange(reorderBlocks(newBlocks));
      }
    }
  };

  const handleBlockChange = (updatedBlock: LessonBlock) => {
    const newBlocks = blocks.map((b) =>
      b.id === updatedBlock.id ? updatedBlock : b
    );
    onChange(newBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    const newBlocks = blocks.filter((b) => b.id !== id);
    onChange(reorderBlocks(newBlocks));
    if (editingBlockId === id) {
      setEditingBlockId(null);
    }
  };

  const handleAddBlock = (type: BlockType, afterId?: string) => {
    const newBlock = createBlock(type);
    const afterIndex = afterId
      ? blocks.findIndex((b) => b.id === afterId)
      : blocks.length - 1;
    const insertIndex = afterIndex + 1;

    const newBlocks = [...blocks];
    newBlocks.splice(insertIndex, 0, { ...newBlock, order: insertIndex });
    onChange(reorderBlocks(newBlocks));
    setEditingBlockId(newBlock.id);
  };

  const activeBlock = activeId
    ? blocks.find((b) => b.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={setDroppableRef}
        className={cn(
          'min-h-[500px] rounded-xl transition-all duration-200',
          isOver && 'bg-primary/5 ring-2 ring-primary ring-offset-2',
          blocks.length === 0 && 'border-2 border-dashed border-muted-foreground/25'
        )}
      >
        {blocks.length === 0 ? (
          <EmptyState onAddBlock={handleAddBlock} />
        ) : (
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {blocks.map((block) => (
                <SortableBlockWrapper
                  key={block.id}
                  block={block}
                  isEditing={editingBlockId === block.id}
                  onEdit={() => setEditingBlockId(block.id)}
                  onClose={() => setEditingBlockId(null)}
                  onChange={handleBlockChange}
                  onDelete={() => handleDeleteBlock(block.id)}
                  onAddAfter={(type) => handleAddBlock(type, block.id)}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      <DragOverlay>
        {activeBlock && (
          <div className="bg-background border-2 border-primary rounded-xl shadow-2xl p-4 opacity-95 rotate-1">
            <BlockRenderer
              block={activeBlock}
              onChange={() => {}}
              isEditing={false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableBlockWrapperProps {
  block: LessonBlock;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onChange: (block: LessonBlock) => void;
  onDelete: () => void;
  onAddAfter: (type: BlockType) => void;
}

function SortableBlockWrapper({
  block,
  isEditing,
  onEdit,
  onClose,
  onChange,
  onDelete,
  onAddAfter,
}: SortableBlockWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blockMeta = BLOCK_TYPES.find((t) => t.type === block.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-background rounded-xl transition-all duration-200',
        'border shadow-sm',
        isDragging && 'opacity-50 z-50 shadow-lg scale-[1.02]',
        isEditing
          ? 'ring-2 ring-primary border-primary shadow-md'
          : 'hover:shadow-md hover:border-primary/30'
      )}
    >
      {/* Drag handle - left side */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute -left-3 top-1/2 -translate-y-1/2 z-10',
          'flex items-center justify-center w-6 h-12 rounded-lg',
          'bg-muted border shadow-sm cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-primary/10 hover:border-primary/50'
        )}
      >
        <Icon name="GripVertical" className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Block header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10">
            <Icon
              name={blockMeta?.icon || 'Box'}
              className="h-4 w-4 text-primary"
            />
          </div>
          <span className="text-sm font-medium">{blockMeta?.label || block.type}</span>
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
              className="h-7 px-2.5 text-xs"
            >
              <Icon name="Check" className="h-3.5 w-3.5 mr-1" />
              Done
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
            >
              <Icon name="Pencil" className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 opacity-60 hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Icon name="Trash2" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Block content */}
      <div
        className={cn(
          "p-4 cursor-pointer",
          !isEditing && "hover:bg-muted/30 transition-colors"
        )}
        onClick={() => !isEditing && onEdit()}
      >
        <BlockRenderer block={block} onChange={onChange} isEditing={isEditing} />
      </div>

      {/* Add block button (appears on hover) */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <AddBlockButton onAddBlock={onAddAfter} />
      </div>
    </div>
  );
}

function EmptyState({ onAddBlock }: { onAddBlock: (type: BlockType) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
        <Icon name="Layers" className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Start building your lesson</h3>
      <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
        Add content blocks from the left panel or click below to get started.
        You can drag blocks to reorder them anytime.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {BLOCK_TYPES.slice(0, 3).map((block) => (
          <button
            key={block.type}
            onClick={() => onAddBlock(block.type)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Icon name={block.icon} className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{block.label}</span>
          </button>
        ))}
      </div>
      <AddBlockButton onAddBlock={onAddBlock} />
    </div>
  );
}

function AddBlockButton({
  onAddBlock,
}: {
  onAddBlock: (type: BlockType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-background shadow-sm hover:shadow-md transition-shadow rounded-full px-4"
      >
        <Icon name="Plus" className="h-4 w-4 mr-1.5" />
        Add Block
      </Button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border rounded-xl shadow-xl p-2 z-20 min-w-[220px]">
            <div className="grid grid-cols-2 gap-1.5">
              {BLOCK_TYPES.map((block) => (
                <button
                  key={block.type}
                  onClick={() => {
                    onAddBlock(block.type);
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-accent text-center transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon name={block.icon} className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium">{block.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper to update order field after reordering
function reorderBlocks(blocks: LessonBlock[]): LessonBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    order: index,
  }));
}
