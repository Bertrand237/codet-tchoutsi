import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import type { UserRole } from "@shared/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
