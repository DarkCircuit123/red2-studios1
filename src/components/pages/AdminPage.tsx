import { lazy, Suspense } from 'react';
import AdminAccessGate from '@/components/AdminAccessGate';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const AdminDashboard = lazy(() => import('@/components/AdminPanel/AdminDashboard'));

export default function AdminPage() {
  return <AdminAccessGate>
    <Suspense fallback={<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"><LoadingSpinner /></div>}>
      <AdminDashboard />
    </Suspense>
  </AdminAccessGate>;
}
