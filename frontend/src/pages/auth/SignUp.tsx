import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCSRFToken } from '@/lib/getCookie';
import PageWrapper from '@/components/layout/PageWrapper';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

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
    
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
    
    // Clear signup error
    if (signupError) {
      setSignupError(null);
    }
  };

  const validateForm = () => {
    const errors = {
      firstName: !formData.firstName,
      lastName: !formData.lastName,
      email: !formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      password: !formData.password || formData.password.length < 8,
      confirmPassword: !formData.confirmPassword || formData.password !== formData.confirmPassword,
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
    setSignupError(null);

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
      setSignupError('CSRF token not found. Please refresh and try again.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/v1/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include', // Important: ensures cookies are sent with the request
      });

      // Check if the response is ok before attempting to parse JSON
      if (!response.ok) {
        if (response.status === 403) {
          setSignupError('CSRF verification failed. Please refresh the page and try again.');
          setIsSubmitting(false);
          return;
        }
   
        if (response.status === 405) {
          setSignupError('Signup method not allowed. Please contact support.');
          setIsSubmitting(false);
          return;
        }
        
        try {
          // Try to get error details from response
          const errorData = await response.json();
          setSignupError(errorData.error || `Error: ${response.status} ${response.statusText}`);
        } catch (jsonError) {
          // If JSON parsing fails, use status text
          setSignupError(`Error: ${response.status} ${response.statusText}`);
        }
        setIsSubmitting(false);
        return;
      }

      // Only parse JSON if the response is ok
      const data = await response.json();
      
      if (data.success) {
        setSignupSuccess(true);
      } else {
        setSignupError(data.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSignupError('An unexpected error occurred. Please try again.');
    }

    setIsSubmitting(false);
  };

  if (signupSuccess) {
    return (
      <PageWrapper>
        <section className="h-[calc(100vh-24rem)] min-h-[390px] bg-muted/30 flex items-center justify-center py-2">
            <div className="flex w-full max-w-sm flex-col items-center gap-y-8 rounded-md border border-border bg-card px-6 py-12 shadow-md">
            <div className="text-green-500 text-5xl">✓</div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Account Created Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Welcome! Your account has been created and you've been automatically logged in.
              </p>
              <Button 
                onClick={() => navigate({ to: '/' })}
                className="w-full"
              >
                Go to Dashboard
              </Button>
          </div>
        </div>
      </section>
      </PageWrapper>
    );
  }

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
            <h1 className="text-3xl font-semibold text-foreground">Create Account</h1>
          </div>

          {signupError && (
            <div className="w-full bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {signupError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-2">
                  <Input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className={`bg-background ${formErrors.firstName ? 'border-destructive' : ''}`}
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-destructive">First name is required</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className={`bg-background ${formErrors.lastName ? 'border-destructive' : ''}`}
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-destructive">Last name is required</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`bg-background ${formErrors.email ? 'border-destructive' : ''}`}
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive">Please enter a valid email address</p>
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
                  <p className="text-xs text-destructive">Password must be at least 8 characters</p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`bg-background ${formErrors.confirmPassword ? 'border-destructive' : ''}`}
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              
              <div className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="mt-2 w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </div>
          </form>
          
          <div className="flex justify-center gap-1 text-sm text-muted-foreground">
            <p>Already have an account?</p>
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Login
            </Link>
        </div>
      </div>
    </section>
    </PageWrapper>
  );
};

export default SignUp; 