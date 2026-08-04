import React from 'react';
import { useMember } from '@/integrations';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import AdminDashboard from '../AdminPanel/AdminDashboard';
import { AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const { member } = useMember();

  // Check if user is admin (you can customize this logic)
  const isAdmin = member?.profile?.nickname === 'admin' || member?.loginEmail?.includes('admin');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You do not have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
