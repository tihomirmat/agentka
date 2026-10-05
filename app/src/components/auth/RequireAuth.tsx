import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '@/data/api';

/**
 * Layout route: lets signed-in people through, sends everyone else to /prijava.
 * The page they wanted is kept in the link state (`from`), so Login can return there.
 */
export function RequireAuth() {
  const session = useSession();
  const location = useLocation();
  if (!session.loggedIn) {
    return <Navigate to="/prijava" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Layout route for the platform admin area. A signed-in customer lands back in the app. */
export function RequireAdmin() {
  const session = useSession();
  const location = useLocation();
  if (!session.loggedIn) {
    return <Navigate to="/prijava" replace state={{ from: location.pathname }} />;
  }
  if (session.role !== 'admin') {
    return <Navigate to="/app/pregled" replace />;
  }
  return <Outlet />;
}
