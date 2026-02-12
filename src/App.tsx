import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Landing from "./pages/Landing";
import ChildInvite from "./pages/ChildInvite";
import InstallGuide from "./pages/InstallGuide";
import NotFound from "./pages/NotFound";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AboutPage } from "@/components/AboutPage";
import buffLogo from '@/assets/buff-logo.png';
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Loading component with Buff logo
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <img src={buffLogo} alt="Buff" className="w-20 h-20 animate-pulse" />
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-muted-foreground">טוען...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute - The Auth Guard
 * 
 * This component enforces the authentication funnel:
 * 1. Not authenticated -> Redirect to /auth
 * 2. Authenticated but no profile -> Redirect to /auth/callback (role selection)
 * 3. Profile exists but no family_id -> Redirect to /auth/callback (family setup)
 * 4. Everything complete -> Show children
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while checking auth status
  if (loading) return <LoadingScreen />;
  
  // Not authenticated -> redirect to login
  if (!user) return <Navigate to="/auth" replace />;
  
  // Authenticated but no profile or missing family_id -> complete onboarding
  if (user && (!profile || !profile.family_id)) {
    return <Navigate to="/auth/callback" replace />;
  }

  // Fully authenticated and onboarded
  return <>{children}</>;
}

/**
 * PublicRoute - For login/landing pages
 * 
 * Redirects authenticated users with complete profiles to dashboard
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  
  // If user is fully authenticated with a complete profile, go to dashboard
  if (user && profile?.family_id) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * AuthCallbackRoute - Special handling for OAuth callback
 * 
 * Allows authenticated users without profiles to access the callback page
 * for role selection and family setup
 */
function AuthCallbackRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  
  // If no user at all, redirect to auth
  if (!user) return <Navigate to="/auth" replace />;
  
  // If user has complete profile with family, redirect to dashboard
  if (user && profile?.family_id) {
    return <Navigate to="/dashboard" replace />;
  }

  // User needs to complete onboarding - show callback page
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.email !== 'adi.elgarat@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AboutPageWrapper() {
  const navigate = useNavigate();
  return <AboutPage onBack={() => navigate("/dashboard", { replace: true })} />;
}

const AppRoutes = () => (
  <Routes>
    {/* Public marketing landing page - redirects authenticated users to dashboard */}
    <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
    
    {/* Auth page - login/signup */}
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    
    {/* OAuth Callback - handles role selection and family setup */}
    <Route path="/auth/callback" element={<AuthCallbackRoute><AuthCallback /></AuthCallbackRoute>} />
    
    {/* Child Magic Link Invite */}
    <Route path="/join" element={<PublicRoute><ChildInvite /></PublicRoute>} />
    
    {/* Install Guide - Shows video tutorial for PWA installation */}
    <Route path="/install" element={<PublicRoute><InstallGuide /></PublicRoute>} />
    
    {/* Protected dashboard - the main app (requires full auth + profile + family) */}
    <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    
    {/* Admin dashboard - restricted to specific admin email */}
    <Route path="/admin" element={<ProtectedRoute><AdminGuard><AdminDashboard /></AdminGuard></ProtectedRoute>} />
    
    {/* About page - public */}
    <Route path="/about" element={<AboutPageWrapper />} />
    
    {/* Legacy route redirect */}
    <Route path="/app" element={<Navigate to="/dashboard" replace />} />
    
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UpdatePrompt />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
