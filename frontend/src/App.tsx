import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Runs from "@/pages/Runs";
import RunDetail from "@/pages/RunDetail";
import Files from "@/pages/Files";
import Pricing from "@/pages/Pricing";
import SettingsLayout from "@/pages/SettingsLayout";
import SettingsAccount from "@/pages/SettingsAccount";
import SettingsPreferences from "@/pages/SettingsPreferences";
import ToolPage from "@/pages/ToolPage";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminKeys from "@/pages/admin/AdminKeys";
import AdminActivity from "@/pages/admin/AdminActivity";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />
            <Route path="/forgot-password" element={<Login />} />
            
            {/* App */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="runs" element={<Runs />} />
              <Route path="runs/:id" element={<RunDetail />} />
              <Route path="files" element={<Files />} />
              <Route path="pricing" element={<Pricing />} />
              
              {/* Tools */}
              <Route path="tools/:toolId" element={<ToolPage />} />
              
              {/* Settings */}
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="account" replace />} />
                <Route path="account" element={<SettingsAccount />} />
                <Route path="preferences" element={<SettingsPreferences />} />
              </Route>
            </Route>

            {/* Admin Portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="keys" element={<AdminKeys />} />
              <Route path="activity" element={<AdminActivity />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
