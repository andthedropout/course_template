import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { getCSRFToken } from '@/lib/getCookie';
import { useAuth } from '@/hooks/useAuth';
import PageWrapper from '@/components/layout/PageWrapper';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Get CSRF token
        await fetch('/api/v1/csrf_token/', {
          method: 'GET',
          credentials: 'include',
        });

        const csrfToken = getCSRFToken();

        if (!csrfToken) {
          setError('CSRF token not found. Please refresh and try again.');
          return;
        }

        // Call logout endpoint
        const response = await fetch('/api/v1/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Logout failed. Please try again.');
          return;
        }

        const data = await response.json();

        if (data.success) {
          // Clear user state
          updateUser(null);
          // Redirect to home
          navigate({ to: '/' });
        } else {
          setError(data.error || 'Logout failed. Please try again.');
        }
      } catch (err) {
        console.error('Logout error:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    };

    handleLogout();
  }, [navigate, updateUser]);

  if (error) {
    return (
      <PageWrapper>
        <section className="h-[calc(100vh-24rem)] min-h-[440px] bg-muted/30 flex items-center justify-center py-2">
          <div className="flex w-full max-w-sm flex-col items-center gap-y-8 rounded-md border border-border bg-card px-6 py-12 shadow-md">
          <div className="w-full bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-primary hover:underline"
          >
            Return to Home
          </button>
        </div>
      </section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <section className="h-[calc(100vh-24rem)] min-h-[440px] bg-muted/30 flex items-center justify-center py-2">
        <div className="flex w-full max-w-sm flex-col items-center gap-y-8 rounded-md border border-border bg-card px-6 py-12 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Logging out...</h1>
          <p className="text-sm text-muted-foreground">Please wait while we sign you out.</p>
        </div>
      </div>
    </section>
    </PageWrapper>
  );
};

export default Logout;
