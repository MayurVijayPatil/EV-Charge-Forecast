import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/hooks/use-user";
import { WelcomeModal } from "@/components/WelcomeModal";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import DataUpload from "@/pages/DataUpload";
import ForecastsPage from "@/pages/Forecasts";
import Reports from "@/pages/Reports";
import GridImpact from "@/pages/GridImpact";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/upload" component={DataUpload} />
      <Route path="/forecasts" component={ForecastsPage} />
      <Route path="/reports" component={Reports} />
      <Route path="/grid-impact" component={GridImpact} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <WelcomeModal />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
