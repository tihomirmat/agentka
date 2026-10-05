import { createHashRouter, Navigate } from 'react-router-dom';
import { RequireAdmin, RequireAuth } from '@/components/auth/RequireAuth';
import { AdminShell, AppShell, PublicShell, WizardShell } from '@/components/layout';

import Landing from '@/pages/public/Landing';
import Pricing from '@/pages/public/Pricing';
import Login from '@/pages/public/Login';
import Register from '@/pages/public/Register';
import Wizard from '@/pages/wizard/Wizard';
import Overview from '@/pages/app/Overview';
import Knowledge from '@/pages/app/Knowledge';
import Booking from '@/pages/app/Booking';
import Notifications from '@/pages/app/Notifications';
import Conversations from '@/pages/app/Conversations';
import ConversationDetail from '@/pages/app/ConversationDetail';
import Leads from '@/pages/app/Leads';
import Bookings from '@/pages/app/Bookings';
import Install from '@/pages/app/Install';
import Subscription from '@/pages/app/Subscription';
import Settings from '@/pages/app/Settings';
import Accounts from '@/pages/admin/Accounts';
import AccountDetail from '@/pages/admin/AccountDetail';
import Plans from '@/pages/admin/Plans';
import Gallery from '@/pages/Gallery';
import NotFound from '@/pages/NotFound';

/**
 * All addresses of the app. The shell of each area is a layout route, so a page file
 * renders only its own content. Hash routing keeps the build working from any folder.
 */
export const router = createHashRouter([
  {
    element: <PublicShell />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/cenik', element: <Pricing /> },
      { path: '/prijava', element: <Login /> },
      { path: '/registracija', element: <Register /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <WizardShell />,
        children: [
          { path: '/zacetek', element: <Wizard /> },
          { path: '/zacetek/:step', element: <Wizard /> },
        ],
      },
      {
        element: <AppShell />,
        children: [
          { path: '/app', element: <Navigate to="/app/pregled" replace /> },
          { path: '/app/pregled', element: <Overview /> },
          { path: '/app/viri', element: <Knowledge /> },
          { path: '/app/termini', element: <Booking /> },
          { path: '/app/obvestila', element: <Notifications /> },
          { path: '/app/pogovori', element: <Conversations /> },
          { path: '/app/pogovori/:id', element: <ConversationDetail /> },
          { path: '/app/kontakti', element: <Leads /> },
          { path: '/app/rezervacije', element: <Bookings /> },
          { path: '/app/namestitev', element: <Install /> },
          { path: '/app/narocnina', element: <Subscription /> },
          { path: '/app/nastavitve', element: <Settings /> },
        ],
      },
    ],
  },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { path: '/admin', element: <Accounts /> },
          { path: '/admin/racuni/:id', element: <AccountDetail /> },
          { path: '/admin/paketi', element: <Plans /> },
        ],
      },
    ],
  },
  // Review page for the design system. No login, no shell.
  { path: '/_ui', element: <Gallery /> },
]);
