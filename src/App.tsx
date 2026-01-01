import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/settingsStore";
import Index from "./pages/Index";
import { AuthPage } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { WorkoutPage } from "./pages/Workout";
import { InsightsPage } from "./pages/Insights";
import { HistoryPage } from "./pages/History";
import { EvolutionPage } from "./pages/Evolution";
import { WorkoutProfilesEnhancedPage } from "./pages/WorkoutProfilesEnhanced";
import { FitAIPage } from "./pages/FitAI";
import { AISettingsPage } from "./pages/AISettings";
import { SettingsPage } from "./pages/Settings";
import { GoalsPage } from "./pages/Goals";
import { ProgressPhotosEnhancedPage } from "./pages/ProgressPhotosEnhanced";
import { SupplementsPage } from "./pages/Supplements";
import { AchievementsPage } from "./pages/Achievements";
import { SocialPage } from "./pages/Social";
import { WeeklyReportPage } from "./pages/WeeklyReport";
import { ResetPasswordPage } from "./pages/ResetPassword";
import { UpdatePasswordPage } from "./pages/UpdatePassword";
import { PhotoComparisonPage } from "./pages/PhotoComparison";
import { ProfilePage } from "./pages/Profile";
import { Layout } from "./components/Layout";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

const AppContent = () => {
  const { theme } = useSettingsStore();
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/workout" element={<ProtectedRoute><WorkoutPage /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/evolution" element={<ProtectedRoute><EvolutionPage /></ProtectedRoute>} />
        <Route path="/workout-profiles" element={<ProtectedRoute><WorkoutProfilesEnhancedPage /></ProtectedRoute>} />
        <Route path="/fit-ai" element={<ProtectedRoute><FitAIPage /></ProtectedRoute>} />
        <Route path="/ai-settings" element={<ProtectedRoute><AISettingsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
        <Route path="/progress-photos" element={<ProtectedRoute><ProgressPhotosEnhancedPage /></ProtectedRoute>} />
        <Route path="/photo-comparison" element={<ProtectedRoute><PhotoComparisonPage /></ProtectedRoute>} />
        <Route path="/supplements" element={<ProtectedRoute><SupplementsPage /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><SocialPage /></ProtectedRoute>} />
        <Route path="/weekly-report" element={<ProtectedRoute><WeeklyReportPage /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
