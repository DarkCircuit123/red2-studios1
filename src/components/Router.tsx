import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { playShutterSound } from '@/lib/click-sound';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import BookingPage from './pages/BookingPage';
import ClientGalleriesPage from './pages/ClientGalleriesPage';
import BlogPage from './pages/BlogPage';
import ProfilePage from './pages/ProfilePage';
import PrivatePage from './pages/PrivatePage';
import HangmanGamePage from './pages/HangmanGamePage';
import ClientLoginPage from './pages/ClientLoginPage';
import ClientGalleryViewPage from './pages/ClientGalleryViewPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useEffect, useRef } from 'react';

// Layout component that includes ScrollToTop and page change sound
function Layout() {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      playShutterSound();
      prevLocationRef.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "portfolio",
        element: <PortfolioPage />,
      },
      {
        path: "portfolio/:id",
        element: <PortfolioDetailPage />,
      },
      {
        path: "booking",
        element: <BookingPage />,
      },
      {
        path: "galleries",
        element: <ClientGalleriesPage />,
      },
      {
        path: "blog",
        element: <BlogPage />,
      },
      {
        path: "profile",
        element: (
          <MemberProtectedRoute>
            <ProfilePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "private",
        element: <PrivatePage />,
      },
      {
        path: "play",
        element: <HangmanGamePage />,
      },
      {
        path: "client-login",
        element: <ClientLoginPage />,
      },
      {
        path: "client-gallery/:id",
        element: <ClientGalleryViewPage />,
      },
      {
        path: "admin-login",
        element: <AdminLoginPage />,
      },
      {
        path: "admin-dashboard",
        element: <AdminDashboardPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
