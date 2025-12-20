import React from 'react';
import { Link } from '@tanstack/react-router';
import AnimatedBackground from '@/components/backgrounds/AnimatedBackground';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <AnimatedBackground
      type="clouds"
      opacity={0.6}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-6xl font-bold tracking-tight">
            Django + React Starter
          </h1>

          <p className="text-xl text-muted-foreground">
            A modern full-stack template with Django, React, TypeScript, and TailwindCSS
          </p>

          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/ssr-test">
                View SSR Demo
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link to="/signup">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
