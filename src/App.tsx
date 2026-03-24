import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Purchasing from "./pages/Purchasing.tsx";
import StockOpname from "./pages/StockOpname.tsx";
import TransactionHistory from "./pages/TransactionHistory.tsx";
import UserManagement from "./pages/UserManagement.tsx";
import ProductManagement from "./pages/ProductManagement.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Reports from "./pages/Reports.tsx";
import ActivityLogs from "./pages/ActivityLogs.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Kasir + Admin */}
            <Route path="/" element={<ProtectedRoute allowedRoles={["admin", "kasir"]}><Index /></ProtectedRoute>} />
            <Route path="/stock-opname" element={<ProtectedRoute allowedRoles={["admin", "kasir"]}><StockOpname /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute allowedRoles={["admin", "kasir"]}><TransactionHistory /></ProtectedRoute>} />
            {/* Admin only */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/product-management" element={<ProtectedRoute allowedRoles={["admin"]}><ProductManagement /></ProtectedRoute>} />
            <Route path="/purchasing" element={<ProtectedRoute allowedRoles={["admin"]}><Purchasing /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin"]}><Reports /></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/activity-logs" element={<ProtectedRoute allowedRoles={["admin"]}><ActivityLogs /></ProtectedRoute>} />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
