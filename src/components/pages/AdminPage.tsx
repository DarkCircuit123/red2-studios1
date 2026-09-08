import { lazy, Suspense } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import AdminAccessGate from '@/components/AdminAccessGate';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load AdminDashboard (new tabbed interface with WorkGalleryManager)
const AdminDashboard = lazy(() => import('@/components/AdminPanel/AdminDashboard'));

/**
 * Admin Page - Protected route for admin dashboard
 * Requires Wix Member authentication + admin role verification
 */
export default function AdminPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Sign in to access the admin panel">
      <AdminAccessGate
        onAccessDenied={() => {
          // Access denied - component will show permission denied message
        }}
      >
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
              <LoadingSpinner />
            </div>
          }
        >
          <AdminDashboard />
        </Suspense>
      </AdminAccessGate>
    </MemberProtectedRoute>
  );
}
