import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: string;
  redirectTo?: string;
}

const ADMIN_EMAILS = ['jordanzuniga@gmail.com'];

export default function ProtectedRoute({
  children,
  requireRole,
  redirectTo = '/',
}: ProtectedRouteProps) {
  const { member, isLoading } = useMember();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated
  if (!member) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role if required
  if (requireRole) {
    const isAdmin = ADMIN_EMAILS.includes(member.loginEmail || '');
    if (!isAdmin) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
}
