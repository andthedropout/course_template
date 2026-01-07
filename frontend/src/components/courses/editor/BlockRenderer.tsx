import {
  LessonBlock,
  isTextBlock,
  isVideoBlock,
  isCodeBlock,
  isCalloutBlock,
  isImageBlock,
  isDividerBlock,
  isResourceBlock,
} from './types';
import {
  TextBlock,
  VideoBlock,
  CodeBlock,
  CalloutBlock,
  ImageBlock,
  DividerBlock,
  ResourceBlock,
} from './blocks';

interface BlockRendererProps {
  block: LessonBlock;
  onChange: (block: LessonBlock) => void;
  isEditing?: boolean;
}

export function BlockRenderer({ block, onChange, isEditing }: BlockRendererProps) {
  const handleDataChange = (data: LessonBlock['data']) => {
    onChange({ ...block, data });
  };

  if (isTextBlock(block)) {
    return (
      <TextBlock
        data={block.data}
        onChange={handleDataChange}
        isEditing={isEditing}
      />
    );
  }

  if (isVideoBlock(block)) {
    return (
      <VideoBlock
        data={block.data}
        onChange={handleDataChange}
        isEditing={isEditing}
      />
    );
  }

  if (isCodeBlock(block)) {
    return (
      <CodeBlock
        data={block.data}
        onChange={handleDataChange}
        isEditing={isEditing}
      />
    );
  }

  if (isCalloutBlock(block)) {
    return (
      <CalloutBlock
        data={block.data}
        onChange={handleDataChange}
        isEditing={isEditing}
      />
    );
  }

  if (isImageBlock(block)) {
    return (
      <ImageBlock
        data={block.data}
        onChange={handleDataChange}
        isEditing={isEditing}
      />
    );
  }

  if (isDividerBlock(block)) {
    return (
      <DividerBlock
        data={block.data}
        onChange={handleDataChange}
        isEditing={isEditing}
      />
    );
  }

  if (isResourceBlock(block)) {
    return (
      <ResourceBlock
        data={block.data}
        onChange={handleDataChange}
        isEditing={isEditing}
      />
    );
  }

  return (
    <div className="p-4 border rounded bg-destructive/10 text-destructive">
      Unknown block type: {block.type}
    </div>
  );
}
