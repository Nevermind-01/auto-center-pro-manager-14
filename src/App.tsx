import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import NovaOSSupabase from "./pages/NovaOSSupabase";
import InventorySupabase from "./pages/InventorySupabase";
import Clientes from "./pages/Clientes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/nova-os" element={<Layout><NovaOSSupabase /></Layout>} />
          <Route path="/sales" element={<Layout><Sales /></Layout>} />
          <Route path="/inventory" element={<Layout><InventorySupabase /></Layout>} />
          <Route path="/clientes" element={<Layout><Clientes /></Layout>} />
          <Route path="/history" element={<Layout><div>Histórico (em desenvolvimento)</div></Layout>} />
          <Route path="/settings" element={<Layout><div>Configurações (em desenvolvimento)</div></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
