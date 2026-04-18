import { Route, Switch, Redirect } from "wouter";
import { useAuth } from "./auth/AuthProvider";
import LoginPage from "./auth/LoginPage";
import AppLayout from "./components/AppLayout";
import Overview from "./pages/Overview";
import AccountDetail from "./pages/AccountDetail";
import NewAccount from "./pages/NewAccount";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/accounts/new" component={NewAccount} />
        <Route path="/accounts/:id">
          {(params) => <AccountDetail id={params.id} />}
        </Route>
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </AppLayout>
  );
}
