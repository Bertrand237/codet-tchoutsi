import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import MembersPage from "@/pages/MembersPage";
import BudgetPage from "@/pages/BudgetPage";
import CalendarPage from "@/pages/CalendarPage";
import VotesPage from "@/pages/VotesPage";
import PaymentsPage from "@/pages/PaymentsPage";
import CensusPage from "@/pages/CensusPage";
import ChatPage from "@/pages/ChatPage";
import BlogPage from "@/pages/BlogPage";
import AdsPage from "@/pages/AdsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  const { currentUser, loading } = useAuth();

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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background sticky top-0 z-10">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">C</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">CODET</h1>
                <p className="text-xs text-muted-foreground">Comité de Développement</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <a href="/login">Connexion</a>
              </Button>
              <Button asChild size="sm">
                <a href="/register">S'inscrire</a>
              </Button>
            </div>
          </div>
        </header>
        <main>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/blog" component={BlogPage} />
            <Route path="*">
              <Redirect to="/blog" />
            </Route>
          </Switch>
        </main>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={() => <Redirect to="/dashboard" />} />
              <Route path="/login" component={() => <Redirect to="/dashboard" />} />
              <Route path="/register" component={() => <Redirect to="/dashboard" />} />
              
              <Route path="/dashboard">
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              </Route>

              <Route path="/projects">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier", "commissaire", "membre"]}>
                  <ProjectsPage />
                </ProtectedRoute>
              </Route>

              <Route path="/members">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier", "commissaire"]}>
                  <MembersPage />
                </ProtectedRoute>
              </Route>

              <Route path="/budget">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier"]}>
                  <BudgetPage />
                </ProtectedRoute>
              </Route>

              <Route path="/calendar">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier", "commissaire", "membre"]}>
                  <CalendarPage />
                </ProtectedRoute>
              </Route>

              <Route path="/votes">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier", "commissaire", "membre"]}>
                  <VotesPage />
                </ProtectedRoute>
              </Route>

              <Route path="/payments">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier", "commissaire", "membre"]}>
                  <PaymentsPage />
                </ProtectedRoute>
              </Route>

              <Route path="/census">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier", "commissaire", "membre"]}>
                  <CensusPage />
                </ProtectedRoute>
              </Route>

              <Route path="/chat">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier", "commissaire", "membre"]}>
                  <ChatPage />
                </ProtectedRoute>
              </Route>

              <Route path="/blog" component={BlogPage} />

              <Route path="/ads">
                <ProtectedRoute allowedRoles={["admin", "président"]}>
                  <AdsPage />
                </ProtectedRoute>
              </Route>

              <Route path="/profile">
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              </Route>

              <Route path="/statistics">
                <ProtectedRoute allowedRoles={["admin", "président", "trésorier"]}>
                  <DashboardPage />
                </ProtectedRoute>
              </Route>

              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedRouter />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
