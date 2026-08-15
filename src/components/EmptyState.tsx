'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  };
  className?: string;
}

/**
 * A reusable, branded empty-state component for CODET.
 *
 * Renders a centered icon inside a muted circle, a title,
 * a muted description, and an optional emerald-accented action button.
 * Fades in with a subtle CSS animation.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={
        'relative flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in-0 duration-500 ' +
        className
      }
    >
      {/* Geometric SVG illustration */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="0.5" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="0.5" />
        <line x1="43" y1="43" x2="157" y2="157" stroke="currentColor" strokeWidth="0.5" />
        <line x1="157" y1="43" x2="43" y2="157" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* Icon circle */}
      <div className="relative h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-emerald-500" />
      </div>

      {/* Title */}
      <h3 className="relative text-lg font-semibold mb-1">{title}</h3>

      {/* Description */}
      <p className="relative text-sm text-muted-foreground max-w-md mb-4">
        {description}
      </p>

      {/* Optional action button */}
      {action && (
        <Button
          variant={action.variant ?? 'default'}
          onClick={action.onClick}
          className={
            (!action.variant || action.variant === 'default')
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : ''
          }
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
