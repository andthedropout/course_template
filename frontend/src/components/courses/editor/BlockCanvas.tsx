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
          'min-h-[400px] rounded-lg transition-colors',
          isOver && 'bg-primary/5 ring-2 ring-primary/20',
          blocks.length === 0 && 'border-2 border-dashed'
        )}
      >
        {blocks.length === 0 ? (
          <EmptyState onAddBlock={handleAddBlock} />
        ) : (
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
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
          <div className="bg-background border rounded-lg shadow-lg p-4 opacity-90">
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
        'group relative bg-background border rounded-lg transition-all',
        isDragging && 'opacity-50 z-50',
        isEditing ? 'ring-2 ring-primary' : 'hover:border-primary/50'
      )}
    >
      {/* Block header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <Icon name="GripVertical" className="h-4 w-4 text-muted-foreground" />
          </button>
          <Icon
            name={blockMeta?.icon || 'Box'}
            className="h-4 w-4 text-muted-foreground"
          />
          <span className="text-sm font-medium">{blockMeta?.label || block.type}</span>
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="Check" className="h-4 w-4 mr-1" />
              Done
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Icon name="Pencil" className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Icon name="Trash2" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Block content */}
      <div className="p-4" onClick={() => !isEditing && onEdit()}>
        <BlockRenderer block={block} onChange={onChange} isEditing={isEditing} />
      </div>

      {/* Add block button (appears on hover) */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AddBlockButton onAddBlock={onAddAfter} />
      </div>
    </div>
  );
}

function EmptyState({ onAddBlock }: { onAddBlock: (type: BlockType) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon name="Layers" className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">No content yet</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">
        Drag blocks from the palette or click below to add content to this lesson.
      </p>
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
        className="bg-background shadow-sm"
      >
        <Icon name="Plus" className="h-4 w-4 mr-1" />
        Add Block
      </Button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border rounded-lg shadow-lg p-2 z-20 min-w-[200px]">
            {BLOCK_TYPES.map((block) => (
              <button
                key={block.type}
                onClick={() => {
                  onAddBlock(block.type);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent text-left"
              >
                <Icon name={block.icon} className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{block.label}</span>
              </button>
            ))}
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
