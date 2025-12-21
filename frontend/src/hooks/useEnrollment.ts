import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { checkEnrollment } from '@/api/courses';

export function useEnrollment(courseSlug: string) {
  const { user } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsEnrolled(false);
      setIsLoading(false);
      return;
    }

    const check = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await checkEnrollment(courseSlug);
        setIsEnrolled(result.is_enrolled);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check enrollment');
        setIsEnrolled(false);
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [user, courseSlug]);

  return { isEnrolled, isLoading, error };
}
