import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  is_staff: boolean;
  is_site_manager: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthState = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Initial load
    updateAuthState();

    // Listen for storage changes (when user logs in/out from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        updateAuthState();
      }
    };

    // Listen for custom auth events (when user logs in/out in same tab)
    const handleAuthChange = () => {
      updateAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    // Trigger auth change event
    window.dispatchEvent(new Event('authChange'));
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    // Trigger auth change event
    window.dispatchEvent(new Event('authChange'));
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    updateUser
  };
}; 