import React from 'react';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { ThemeProvider, ToasterProvider, Toaster, ToasterComponent } from '@gravity-ui/uikit';
import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';

const toaster = new Toaster();

interface GravityMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

// Hook to detect system/app theme
function useAppTheme(): 'light' | 'dark' {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    // Check if dark mode class is on document
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  React.useEffect(() => {
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return theme
}

export const GravityMarkdownEditor: React.FC<GravityMarkdownEditorProps> = ({
  value,
  onChange,
  onImageUpload,
}) => {
  console.log('🎨 [GravityEditor] Component render - Props:', {
    hasValue: !!value,
    valueLength: value?.length || 0,
    valuePreview: value?.substring(0, 100) || '(empty)',
    hasOnChange: !!onChange,
    hasImageUpload: !!onImageUpload
  })

  const appTheme = useAppTheme()

  const editor = useMarkdownEditor({
    // Set initial content
    initial: {
      markup: value || '',
      mode: 'wysiwyg',
    },
    md: {
      html: false, // Disable HTML for security
      breaks: true, // Convert line breaks to <br>
    },
    preset: 'full', // Use full preset with all features
    ...(onImageUpload && {
      handlers: {
        uploadFile: async (file: File) => {
          try {
            const url = await onImageUpload(file);
            return { url };
          } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
          }
        },
      },
    }),
  });

  // Sync external value changes to editor (e.g., when loading existing post)
  React.useEffect(() => {
    const currentContent = editor.getValue();
    if (value && value !== currentContent) {
      editor.replace(value);
      // Sync loaded content back to parent state so save works
      onChange(value);
    }
  }, [value, editor, onChange]);

  // Listen for editor changes
  React.useEffect(() => {
    function changeHandler() {
      const newValue = editor.getValue();
      onChange(newValue);
    }

    function updateHandler() {
      const newValue = editor.getValue();
      onChange(newValue);
    }

    function reloadedHandler() {
      const newValue = editor.getValue();
      onChange(newValue);
    }

    editor.on('change', changeHandler);
    editor.on('update', updateHandler);
    editor.on('reloaded', reloadedHandler);

    return () => {
      editor.off('change', changeHandler);
      editor.off('update', updateHandler);
      editor.off('reloaded', reloadedHandler);
    };
  }, [editor, onChange]);

  return (
    <ThemeProvider theme={appTheme}>
      <ToasterProvider toaster={toaster}>
        <ToasterComponent />
        <div className="gravity-markdown-editor-wrapper">
          <MarkdownEditorView
            stickyToolbar
            autofocus
            editor={editor}
            className="min-h-[500px]"
          />
        </div>
      </ToasterProvider>
    </ThemeProvider>
  );
};
