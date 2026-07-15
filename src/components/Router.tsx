import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import HomePage from '@/components/pages/HomePage';
import PortfolioPage from '@/components/pages/PortfolioPage';
import PortfolioDetailPage from '@/components/pages/PortfolioDetailPage';
import BookingPage from '@/components/pages/BookingPage';
import ClientGalleriesPage from '@/components/pages/ClientGalleriesPage';
import BlogPage from '@/components/pages/BlogPage';
import BlogDetailPage from '@/components/pages/BlogDetailPage';
import ProfilePage from '@/components/pages/ProfilePage';
import PrivatePage from '@/components/pages/PrivatePage';
import HangmanGamePage from '@/components/pages/HangmanGamePage';
import ClientRegisterPage from '@/components/pages/ClientRegisterPage';
import ClientGalleryViewPage from '@/components/pages/ClientGalleryViewPage';
import ClientGalleryDashboardPage from '@/components/pages/ClientGalleryDashboardPage';
import WorkPage from '@/components/pages/WorkPage';
import ContactPage from '@/components/pages/ContactPage';
import WatchPage from '@/components/pages/WatchPage';
import BackgroundMusicPlayer from '@/components/BackgroundMusicPlayer';
// ... keep existing code (other imports) ...

// Layout component that includes ScrollToTop and BackgroundMusicPlayer
function Layout() {
  return (
    <>
      <ScrollToTop />
      <BackgroundMusicPlayer />
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
        path: "blog/:id",
        element: <BlogDetailPage />,
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
        path: "client-register",
        element: <ClientRegisterPage />,
      },
      {
        path: "client-gallery-dashboard",
        element: <ClientGalleryDashboardPage />,
      },
      {
        path: "client-gallery/:id",
        element: <ClientGalleryViewPage />,
      },
      {
        path: "work",
        element: <WorkPage />,
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "watch",
        element: <WatchPage />,
      },
      {
        path: "watch/:id",
        element: <WatchPage />,
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
