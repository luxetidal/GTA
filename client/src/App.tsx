import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Businesses from "@/pages/Businesses";
import Inventory from "@/pages/Inventory";
import Sales from "@/pages/Sales";
import NewSale from "@/pages/NewSale";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import Employees from "@/pages/Employees";
import Settings from "@/pages/Settings";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-lg">
            RP
          </div>
          <span className="text-lg font-semibold">GTA RP Business</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
          <Skeleton className="h-2 w-2 rounded-full animate-pulse delay-75" />
          <Skeleton className="h-2 w-2 rounded-full animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
}

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/businesses" component={Businesses} />
      <Route path="/businesses/new" component={Businesses} />
      <Route path="/businesses/:id" component={Businesses} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/inventory/new" component={Inventory} />
      <Route path="/inventory/:id" component={Inventory} />
      <Route path="/sales" component={Sales} />
      <Route path="/sales/new" component={NewSale} />
      <Route path="/sales/:id" component={Sales} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/invoices/:id" component={InvoiceDetail} />
      <Route path="/employees" component={Employees} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 h-16 px-4 border-b bg-background sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-7xl">
              <AuthenticatedRouter />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
