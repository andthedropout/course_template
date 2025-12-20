import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCSRFToken } from '@/lib/getCookie';
import { useAuth } from '@/hooks/useAuth';
import PageWrapper from '@/components/layout/PageWrapper';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState({
    username: false,
    password: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        // Force the browser to get a new CSRF token
        const response = await fetch('/api/v1/csrf_token/', {
          method: 'GET',
          credentials: 'include', // Important: sends cookies with request
        });
            
        if (response.ok) {
          const csrfToken = getCSRFToken();
        } else {
          console.error('Failed to fetch CSRF token:', response.status);
        }
      } catch (error) {
        console.error('Initial CSRF token fetch failed:', error);
      }
    };
    fetchCsrf();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
    
    if (loginError) {
      setLoginError(null);
    }
  };

  const validateForm = () => {
    const errors = {
      username: !formData.username,
      password: !formData.password || formData.password.length < 6
    };

    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);

    // Try to get the CSRF token again just before submission
    try {
      await fetch('/api/v1/csrf_token/', {
        method: 'GET',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to refresh CSRF token before submission:', error);
    }

    const csrfToken = getCSRFToken();
    
    if (!csrfToken) {
      setLoginError('CSRF token not found. Please refresh and try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
        credentials: 'include', // Important: ensures cookies are sent with the request
      });

      // Check if the response is ok before attempting to parse JSON
      if (!response.ok) {
        if (response.status === 403) {
          setLoginError('CSRF verification failed. Please refresh the page and try again.');
          setIsSubmitting(false);
          return;
        }
        
        if (response.status === 405) {
          setLoginError('Login method not allowed. Please contact support.');
          setIsSubmitting(false);
          return;
        }
        
        try {
          // Try to get error details from response
          const errorData = await response.json();
          setLoginError(errorData.error || `Error: ${response.status} ${response.statusText}`);
        } catch (jsonError) {
          // If JSON parsing fails, use status text
          setLoginError(`Error: ${response.status} ${response.statusText}`);
        }
        setIsSubmitting(false);
        return;
      }

      // Only parse JSON if the response is ok
      const data = await response.json();
      
      if (data.success) {
        updateUser(data.user);
        navigate({ to: '/' });
      } else {
        setLoginError(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    }

    setIsSubmitting(false);
  };

  return (
    <PageWrapper className="flex items-center justify-center">
      <section className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
          <div className="flex w-full max-w-sm flex-col items-center gap-y-8 rounded-md border border-border bg-card px-6 py-12 shadow-md">
          <div className="flex flex-col items-center gap-y-2">
            {/* Logo */}
            <div className="flex items-center gap-1 lg:justify-start">
              <Link to="/">
                <img
                  src="/static/images/logo.png"
                  alt="Logo"
                  title="SMLXL"
                  className="h-10"
                />
              </Link>
            </div>
            <h1 className="text-3xl font-semibold text-foreground">Welcome Back</h1>
          </div>
          
          {loginError && (
            <div className="w-full bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {loginError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`bg-background ${formErrors.username ? 'border-destructive' : ''}`}
                />
                {formErrors.username && (
                  <p className="text-xs text-destructive">Please enter your username</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`bg-background ${formErrors.password ? 'border-destructive' : ''}`}
                />
                {formErrors.password && (
                  <p className="text-xs text-destructive">Password must be at least 6 characters</p>
                )}
              </div>
              
              {/* <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-muted-foreground/30 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div> */}
              
              <div className="flex flex-col gap-4">
                <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </div>
          </form>
          
          <div className="flex justify-center gap-1 text-sm text-muted-foreground">
            <p>Don't have an account?</p>
            <Link
              to="/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
        </div>
      </div>
    </section>
    </PageWrapper>
  );
};

export default Login; 