import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import RoCaseLayout from "./components/RoCaseLayout";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import NewCase from "./pages/NewCase";
import Players from "./pages/Players";
import PlayerDetail from "./pages/PlayerDetail";
import Search from "./pages/Search";
import Court from "./pages/Court";
import AuditLog from "./pages/AuditLog";
import Users from "./pages/Users";
import SubmitRequest from "./pages/SubmitRequest";
import MyRequests from "./pages/MyRequests";
import ReviewRequests from "./pages/ReviewRequests";

function Router() {
  return (
    <RoCaseLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/cases" component={Cases} />
        <Route path="/cases/new" component={NewCase} />
        <Route path="/cases/:id" component={CaseDetail} />
        <Route path="/players" component={Players} />
        <Route path="/players/:id" component={PlayerDetail} />
        <Route path="/search" component={Search} />
        <Route path="/court" component={Court} />
        <Route path="/audit" component={AuditLog} />
        <Route path="/users" component={Users} />
        <Route path="/submit-request" component={SubmitRequest} />
        <Route path="/my-requests" component={MyRequests} />
        <Route path="/review-requests" component={ReviewRequests} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </RoCaseLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
