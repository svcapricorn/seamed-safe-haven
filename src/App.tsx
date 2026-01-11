import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { InventoryProvider } from "@/context/InventoryContext";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import InventoryPage from "@/pages/Inventory";
import AddItemPage from "@/pages/AddItem";
import ItemDetailPage from "@/pages/ItemDetail";
import SettingsPage from "@/pages/Settings";
import TemplatesPage from "@/pages/Templates";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/toaster"; // Keeping for smooth transition
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TooltipProvider>
        <BrowserRouter>
          <InventoryProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/inventory/:id" element={<ItemDetailPage />} />
                <Route path="/add" element={<AddItemPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </InventoryProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
