import { TextBlockData } from '../types';
import { GravityMarkdownEditor } from '@/components/blog/editor/GravityMarkdownEditor';
import MarkdownIt from 'markdown-it';

interface TextBlockProps {
  data: TextBlockData;
  onChange: (data: TextBlockData) => void;
  isEditing?: boolean;
}

// Initialize markdown-it for rendering
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

export function TextBlock({ data, onChange, isEditing }: TextBlockProps) {
  if (isEditing) {
    return (
      <div className="min-h-[300px]">
        <GravityMarkdownEditor
          value={data.markdown}
          onChange={(markdown) => onChange({ ...data, markdown })}
        />
      </div>
    );
  }

  // Render markdown as HTML
  const html = md.render(data.markdown || '');

  if (!data.markdown) {
    return (
      <p className="text-muted-foreground italic">No content yet. Click to edit.</p>
    );
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
