import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { LoginCredentials } from '../../types/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/feedback/Alert';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const onSubmit = async (data: LoginCredentials) => {
    setErrorMessage(null);
    try {
      const user = await login(data);
      success(`Welcome back, ${user.name || 'Administrator'}`);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Invalid administrative credentials. Please verify your email and password.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#d6c7b2_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-charcoal-900 text-ivory-50 shadow-xl mb-4 border border-champagne-400/30">
            <span className="font-serif font-bold text-2xl tracking-tight text-champagne-300">
              L
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 tracking-wide">
            LAGOREE ARTS
          </h1>
          <p className="text-xs uppercase tracking-widest text-champagne-700 font-semibold mt-1">
            Administrative Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-ivory-200/80 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-serif font-semibold text-charcoal-900">Sign In</h2>
            <p className="text-xs text-charcoal-500 mt-1">
              Enter your authorized staff credentials to continue.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6">
              <Alert variant="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@lagoreearts.com"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-charcoal-700 transition-colors focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full py-2.5 shadow-md hover:shadow-lg"
                isLoading={isSubmitting}
              >
                Sign In to Console
              </Button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-ivory-100 flex items-center justify-center gap-2 text-[11px] text-charcoal-400">
            <ShieldCheck className="w-3.5 h-3.5 text-champagne-600" />
            <span>Encrypted Session • Role-Protected Environment</span>
          </div>
        </div>
      </div>
    </div>
  );
};
