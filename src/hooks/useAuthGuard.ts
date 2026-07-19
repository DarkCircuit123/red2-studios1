import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';

interface UseAuthGuardOptions {
  requireRole?: string;
  redirectTo?: string;
}

interface UseAuthGuardReturn {
  member: any | null;
  loading: boolean;
}

const ADMIN_EMAILS = ['jordanzuniga@gmail.com'];

export function useAuthGuard(
  options?: UseAuthGuardOptions
): UseAuthGuardReturn {
  const { requireRole, redirectTo = '/' } = options || {};
  const navigate = useNavigate();
  const { member, isLoading } = useMember();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Not authenticated
    if (!member) {
      navigate(redirectTo);
      return;
    }

    // Check role if required
    if (requireRole) {
      const isAdmin = ADMIN_EMAILS.includes(member.loginEmail || '');
      if (!isAdmin) {
        navigate(redirectTo);
      }
    }
  }, [member, isLoading, requireRole, redirectTo, navigate]);

  return {
    member,
    loading: isLoading,
  };
}
