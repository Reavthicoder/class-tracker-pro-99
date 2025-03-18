
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AttendancePage from "./pages/AttendancePage";
import ReportsPage from "./pages/ReportsPage";
import SchedulePage from "./pages/SchedulePage";
import { checkDatabaseConnection } from "./lib/db-check";

const queryClient = new QueryClient();

const App = () => {
  // Check database connection on startup
  useEffect(() => {
    const checkDb = async () => {
      await checkDatabaseConnection();
    };
    
    checkDb();
  }, []);

  // Preload fonts
  useEffect(() => {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
