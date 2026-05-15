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
import Customers from "./pages/Customers.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Reports from "./pages/Reports.tsx";
import ActivityLogs from "./pages/ActivityLogs.tsx";
import Settings from "./pages/Settings.tsx";
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
            {/* Access for each route is controlled by a permission slug stored in DB
                (public.permissions + public.role_permissions). Admin manages who
                can do what without code changes. */}
            <Route path="/" element={<ProtectedRoute requiredPermission="module:pos"><Index /></ProtectedRoute>} />
            <Route path="/stock-opname" element={<ProtectedRoute requiredPermission="module:stock_opname"><StockOpname /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute requiredPermission="module:transactions"><TransactionHistory /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute requiredPermission="module:customers"><Customers /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute requiredPermission="module:dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/product-management" element={<ProtectedRoute requiredPermission="module:products"><ProductManagement /></ProtectedRoute>} />
            <Route path="/purchasing" element={<ProtectedRoute requiredPermission="module:purchasing"><Purchasing /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute requiredPermission="module:reports"><Reports /></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute requiredPermission="module:users"><UserManagement /></ProtectedRoute>} />
            <Route path="/activity-logs" element={<ProtectedRoute requiredPermission="module:activity_logs"><ActivityLogs /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredPermission="module:settings"><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
