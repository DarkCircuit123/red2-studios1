import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { lazy, Suspense, useEffect } from 'react';

// Keep lazy-route failures visible to React Router's error boundary instead of
// converting a real module/chunk failure into a misleading "Error loading page".
function lazyPage<T extends { default: React.ComponentType<any> }>(loader: () => Promise<T>, name: string) {
  return lazy(async () => {
    try {
      return await loader();
    } catch (error) {
      console.error(`[ROUTER] Failed to load ${name}`, error);
      throw error;
    }
  });
}

const HomePage = lazyPage(() => import('./pages/HomePage'), 'HomePage');
const PortfolioPage = lazyPage(() => import('./pages/PortfolioPage'), 'PortfolioPage');
const PortfolioDetailPage = lazyPage(() => import('./pages/PortfolioDetailPage'), 'PortfolioDetailPage');
const BookingPage = lazyPage(() => import('./pages/BookingPage'), 'BookingPage');
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'), 'ProfilePage');
const PrivatePage = lazyPage(() => import('./pages/PrivatePage'), 'PrivatePage');
const HangmanGamePage = lazyPage(() => import('./pages/HangmanGamePage'), 'HangmanGamePage');
const ClientRegisterPage = lazyPage(() => import('./pages/ClientRegisterPage'), 'ClientRegisterPage');
const ContactPage = lazyPage(() => import('./pages/ContactPage'), 'ContactPage');
const AdminPage = lazyPage(() => import('./pages/AdminPage'), 'AdminPage');
const BackgroundMusicPlayer = lazyPage(() => import('./BackgroundMusicPlayer'), 'BackgroundMusicPlayer');
const BlogPage = lazyPage(() => import('./pages/BlogPage'), 'BlogPage');
const BlogDetailPage = lazyPage(() => import('./pages/BlogDetailPage'), 'BlogDetailPage');
const StoriesIndexPage = lazyPage(() => import('./pages/StoriesIndexPage'), 'StoriesIndexPage');
const StoriesDetailPage = lazyPage(() => import('./pages/StoriesDetailPage'), 'StoriesDetailPage');
const WatchPage = lazyPage(() => import('./pages/WatchPage'), 'WatchPage');
const ChatPage = lazyPage(() => import('./pages/ChatPage'), 'ChatPage');
const Red2TerminalPage = lazyPage(() => import('./pages/Red2TerminalPage'), 'Red2TerminalPage');
const ClientLoginPage = lazyPage(() => import('./pages/ClientLoginPage'), 'ClientLoginPage');
const ClientGalleryDashboardPage = lazyPage(() => import('./pages/ClientGalleryDashboardPage'), 'ClientGalleryDashboardPage');
const SeedBookingsPage = lazyPage(() => import('./pages/SeedBookingsPage'), 'SeedBookingsPage');
const SplashScreenAnimated = lazyPage(() => import('./SplashScreenAnimated'), 'SplashScreenAnimated');

function Layout() {
  useEffect(() => {
    document.documentElement.classList.add('js-reveal');

    const observeNewElements = () => {
      const revealElements = document.querySelectorAll('.reveal:not(.is-visible), .reveal-wipe:not(.is-visible)');
      revealElements.forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
              observer.disconnect();
            }
          },
          { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
        );
        observer.observe(el);
      });
    };

    observeNewElements();
    const mutationObserver = new MutationObserver(observeNewElements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      document.querySelectorAll('.reveal:not(.is-visible), .reveal-wipe:not(.is-visible)').forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
              observer.disconnect();
            }
          },
          { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
        );
        observer.observe(el);
      });
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <SplashScreenAnimated onComplete={() => undefined} />
      </Suspense>
      <Suspense fallback={null}>
        <BackgroundMusicPlayer />
      </Suspense>
      <Suspense fallback={<div />}>
        <Outlet />
      </Suspense>
    </>
  );
}

const routeSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<div />}>
    {element}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: routeSuspense(<HomePage />) },
      { path: 'portfolio', element: routeSuspense(<PortfolioPage />) },
      { path: 'portfolio/:id', element: routeSuspense(<PortfolioDetailPage />) },
      { path: 'booking', element: routeSuspense(<BookingPage />) },
      { path: 'profile', element: routeSuspense(<ProfilePage />) },
      { path: 'private', element: routeSuspense(<PrivatePage />) },
      { path: 'play', element: routeSuspense(<HangmanGamePage />) },
      { path: 'client-register', element: routeSuspense(<ClientRegisterPage />) },
      { path: 'work', element: <Navigate to='/portfolio' replace /> },
      { path: 'contact', element: routeSuspense(<ContactPage />) },
      { path: 'blog', element: routeSuspense(<BlogPage />) },
      { path: 'blog/:id', element: routeSuspense(<BlogDetailPage />) },
      { path: 'stories', element: routeSuspense(<StoriesIndexPage />) },
      { path: 'stories/:slug', element: routeSuspense(<StoriesDetailPage />) },
      { path: 'watch', element: routeSuspense(<WatchPage />) },
      { path: 'watch/:id', element: routeSuspense(<WatchPage />) },
      { path: 'chat', element: routeSuspense(<ChatPage />) },
      { path: 'terminal', element: routeSuspense(<Red2TerminalPage />) },
      { path: 'client-login', element: routeSuspense(<ClientLoginPage />) },
      { path: 'client-gallery-dashboard', element: routeSuspense(<ClientGalleryDashboardPage />) },
      { path: 'client-gallery/:id', element: routeSuspense(<ClientGalleryDashboardPage />) },
      { path: 'admin', element: routeSuspense(<AdminPage />) },
      { path: 'seed-bookings', element: routeSuspense(<SeedBookingsPage />) },
      { path: '*', element: <Navigate to='/' replace /> },
    ],
  },
], { basename: import.meta.env.BASE_NAME });

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
