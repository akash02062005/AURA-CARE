import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Chatbot from "@/pages/Chatbot";
import Quiz from "@/pages/Quiz";
import Booking from "@/pages/Booking";
import Resources from "@/pages/Resources";
import Forum from "@/pages/Forum";
import Games from "@/pages/Games";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/AdminDashboard";
import Map from "@/pages/Map";
import Tasks from "@/pages/Tasks";
import Feedback from "@/pages/Feedback";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/chatbot" component={Chatbot} />
          <Route path="/quiz" component={Quiz} />
          <Route path="/booking" component={Booking} />
          <Route path="/resources" component={Resources} />
          <Route path="/forum" component={Forum} />
          <Route path="/games" component={Games} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/map" component={Map} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/feedback" component={Feedback} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Layout>
            <Toaster />
            <Router />
          </Layout>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
