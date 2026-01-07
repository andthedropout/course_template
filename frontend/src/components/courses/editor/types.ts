// Block type definitions for the Course Builder CMS

export type BlockType = 'text' | 'video' | 'code' | 'callout' | 'image' | 'divider' | 'resource';

export interface TextBlockData {
  markdown: string;
}

export interface VideoBlockData {
  url: string;
  title?: string;
  poster?: string;
  // Bunny Stream video support
  bunny_video_id?: number | null;
  bunny_video?: {
    id: number;
    guid: string;
    title: string;
    thumbnail_url: string;
    thumbnail_blurhash?: string;
    duration_seconds: number | null;
    status: string;
  } | null;
  signed_video_url?: string | null;
}

export interface CodeBlockData {
  language: string;
  code: string;
  filename?: string;
}

export type CalloutVariant = 'info' | 'warning' | 'tip' | 'danger';

export interface CalloutBlockData {
  variant: CalloutVariant;
  title?: string;
  content: string;
}

export interface ImageBlockData {
  url: string;
  alt: string;
  caption?: string;
}

export interface DividerBlockData {
  style?: 'line' | 'dots' | 'space';
}

export interface ResourceFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface ResourceBlockData {
  files: ResourceFile[];
  title?: string;
  description?: string;
}

export type BlockData =
  | TextBlockData
  | VideoBlockData
  | CodeBlockData
  | CalloutBlockData
  | ImageBlockData
  | DividerBlockData
  | ResourceBlockData;

export interface LessonBlock<T extends BlockData = BlockData> {
  id: string;
  type: BlockType;
  order: number;
  data: T;
}

// Type guards
export function isTextBlock(block: LessonBlock): block is LessonBlock<TextBlockData> {
  return block.type === 'text';
}

export function isVideoBlock(block: LessonBlock): block is LessonBlock<VideoBlockData> {
  return block.type === 'video';
}

export function isCodeBlock(block: LessonBlock): block is LessonBlock<CodeBlockData> {
  return block.type === 'code';
}

export function isCalloutBlock(block: LessonBlock): block is LessonBlock<CalloutBlockData> {
  return block.type === 'callout';
}

export function isImageBlock(block: LessonBlock): block is LessonBlock<ImageBlockData> {
  return block.type === 'image';
}

export function isDividerBlock(block: LessonBlock): block is LessonBlock<DividerBlockData> {
  return block.type === 'divider';
}

export function isResourceBlock(block: LessonBlock): block is LessonBlock<ResourceBlockData> {
  return block.type === 'resource';
}

// Block metadata for UI
export interface BlockMeta {
  type: BlockType;
  label: string;
  icon: string; // Lucide icon name
  description: string;
}

export const BLOCK_TYPES: BlockMeta[] = [
  {
    type: 'text',
    label: 'Text',
    icon: 'Type',
    description: 'Rich text with markdown support',
  },
  {
    type: 'video',
    label: 'Video',
    icon: 'Play',
    description: 'YouTube, Vimeo, or direct video URL',
  },
  {
    type: 'code',
    label: 'Code',
    icon: 'Code',
    description: 'Syntax-highlighted code block',
  },
  {
    type: 'callout',
    label: 'Callout',
    icon: 'Lightbulb',
    description: 'Info, warning, tip, or danger box',
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'Image',
    description: 'Image with optional caption',
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: 'Minus',
    description: 'Visual separator between sections',
  },
  {
    type: 'resource',
    label: 'Resources',
    icon: 'Download',
    description: 'Downloadable files and materials',
  },
];

// Create a new empty block
export function createBlock(type: BlockType): LessonBlock {
  const id = crypto.randomUUID();
  const base = { id, type, order: 0 };

  switch (type) {
    case 'text':
      return { ...base, data: { markdown: '' } };
    case 'video':
      return { ...base, data: { url: '', title: '' } };
    case 'code':
      return { ...base, data: { language: 'javascript', code: '', filename: '' } };
    case 'callout':
      return { ...base, data: { variant: 'info', title: '', content: '' } };
    case 'image':
      return { ...base, data: { url: '', alt: '', caption: '' } };
    case 'divider':
      return { ...base, data: { style: 'line' } };
    case 'resource':
      return { ...base, data: { files: [], title: '', description: '' } };
  }
}

// Bunny video reference
export interface BunnyVideoRef {
  id: number;
  guid: string;
  title: string;
  duration_seconds: number | null;
  thumbnail_url: string;
  thumbnail_blurhash?: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  file_size_bytes: number | null;
  created_at: string;
}

// Lesson data from API
export interface Lesson {
  id: number;
  title: string;
  slug: string;
  blocks: LessonBlock[];
  video_url: string;
  bunny_video?: BunnyVideoRef | null;
  bunny_video_id?: number | null; // For write operations
  signed_video_url?: string | null;
  duration_minutes: number;
  order: number;
  is_free_preview: boolean;
}

export interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Array<{
    id: number;
    title: string;
    slug: string;
    duration_minutes: number;
    order: number;
    is_free_preview: boolean;
    has_video: boolean;
  }>;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  saleor_product_id: string;
  status: 'draft' | 'published';
  total_lessons: number;
  total_duration_minutes: number;
  modules: Module[];
  created_at: string;
  updated_at: string;
}
