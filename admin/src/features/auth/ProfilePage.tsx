import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, KeyRound, Shield, CheckCircle } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { authApi } from '../../lib/api/auth';
import { formatRoleName } from '../../utils/formatters';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ProfilePage: React.FC = () => {
  const { admin, permissions, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: admin?.name || '',
      email: admin?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>();

  const newPasswordValue = watchPassword('newPassword');

  const onUpdateProfile = async (data: ProfileFormData) => {
    try {
      setIsUpdatingProfile(true);
      await authApi.updateProfile(data);
      await refreshUser();
      success('Profile updated successfully');
    } catch (err: any) {
      error(err?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    try {
      setIsUpdatingPassword(true);
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      success('Password changed successfully');
      resetPassword();
    } catch (err: any) {
      error(err?.message || 'Failed to change password. Verify your current password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <PageContainer
      title="Administrative Profile"
      subtitle="Manage your personal staff credentials, security keys, and inspect role permissions."
      breadcrumbs={[
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'My Profile' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Summary & Permissions */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center text-center p-2">
              <div className="w-20 h-20 rounded-full bg-charcoal-900 text-champagne-300 font-serif font-bold text-2xl flex items-center justify-center shadow-md mb-4 border-2 border-champagne-400">
                {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <h3 className="text-base font-serif font-bold text-charcoal-900">{admin?.name}</h3>
              <p className="text-xs text-charcoal-500 mt-0.5">{admin?.email}</p>

              <div className="mt-4 flex items-center gap-2">
                <StatusBadge status={admin?.role?.slug || 'unknown'} size="md" />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-ivory-100 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500 font-medium">Role Name:</span>
                <span className="text-charcoal-800 font-semibold">
                  {formatRoleName(admin?.role?.slug || '')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500 font-medium">Account Status:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>
            </div>
          </Card>

          {/* Role Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-champagne-700" />
                <span>Granted Permissions ({permissions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permissions.length === 0 ? (
                <p className="text-xs text-charcoal-500">No explicit permissions assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {permissions.map((perm) => (
                    <Badge key={perm} variant="outline" size="sm" className="font-mono text-[10px]">
                      {perm}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Update Profile & Change Password */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Info Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-champagne-700" />
                <span>General Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Your Name"
                  error={profileErrors.name?.message}
                  {...registerProfile('name', { required: 'Name is required' })}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@lagoreearts.com"
                  error={profileErrors.email?.message}
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <KeyRound className="w-4 h-4 text-champagne-700" />
                <span>Security & Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onUpdatePassword)} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••••••"
                  error={passwordErrors.currentPassword?.message}
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required',
                  })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••••••"
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••••••"
                    error={passwordErrors.confirmPassword?.message}
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm new password',
                      validate: (val) => val === newPasswordValue || 'Passwords do not match',
                    })}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    isLoading={isUpdatingPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
