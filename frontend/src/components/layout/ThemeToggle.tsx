import React from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { lightMode, toggleLightMode } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLightMode}
      className="relative"
      aria-label="Toggle theme"
    >
      <Icon name="Sun" className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Icon name="Moon" className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
