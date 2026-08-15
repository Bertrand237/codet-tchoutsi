'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth();

  // Still initializing
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <div className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Non connecté</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Vous devez vous connecter pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  // Check roles if specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <div className="relative w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold">Accès refusé</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
            <br />
            <span className="text-muted-foreground/70">
              Rôle actuel : <strong className="capitalize">{user.role}</strong>
            </span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
