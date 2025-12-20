import React from 'react';
import { Link } from '@tanstack/react-router';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-[9999] w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left section - Logo / Primary Nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-lg">
            Home
          </Link>
          <Link
            to="/blog"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Blog
          </Link>
          {user?.is_staff && (
            <Link
              to="/blog/dashboard"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              CMS Dashboard
            </Link>
          )}
        </div>

        {/* Center section - Optional centered nav */}
        <div className="flex items-center gap-4">
          {/* Add centered navigation items here if needed */}
        </div>

        {/* Right section - Actions / Secondary Nav */}
        <div className="flex items-center gap-4">
          {!isLoading && (
            <>
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/logout">Logout</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
