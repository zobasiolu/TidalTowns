import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/layout/navigation";
import MapPage from "@/pages/map";
import CityPage from "@/pages/city";
import StatsPage from "@/pages/stats";
import EventsPage from "@/pages/events";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col h-screen">
      <Navigation />
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <Switch>
          <Route path="/" component={MapPage} />
          <Route path="/city/:id" component={CityPage} />
          <Route path="/stats/:id" component={StatsPage} />
          <Route path="/events/:id" component={EventsPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
