import { CodeBlockData } from '../types';
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
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';

interface CodeBlockProps {
  data: CodeBlockData;
  onChange: (data: CodeBlockData) => void;
  isEditing?: boolean;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
];

export function CodeBlock({ data, onChange, isEditing }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={data.language}
              onValueChange={(v) => onChange({ ...data, language: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code-filename">Filename (optional)</Label>
            <Input
              id="code-filename"
              value={data.filename || ''}
              onChange={(e) => onChange({ ...data, filename: e.target.value })}
              placeholder="example.js"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code-content">Code</Label>
          <Textarea
            id="code-content"
            value={data.code}
            onChange={(e) => onChange({ ...data, code: e.target.value })}
            placeholder="Enter your code here..."
            className="font-mono text-sm min-h-[200px]"
            rows={10}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {data.filename && (
        <div className="bg-muted px-4 py-2 rounded-t-lg border border-b-0 text-sm text-muted-foreground font-mono">
          {data.filename}
        </div>
      )}
      <div
        className={`relative bg-muted/50 border ${
          data.filename ? 'rounded-b-lg' : 'rounded-lg'
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copyCode}
        >
          <Icon name={copied ? 'Check' : 'Copy'} className="h-4 w-4 mr-1" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <pre className="p-4 overflow-x-auto">
          <code className={`language-${data.language} text-sm`}>
            {data.code || '// No code'}
          </code>
        </pre>
      </div>
    </div>
  );
}
