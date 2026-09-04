import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatRoleName } from '../../utils/formatters';

export const UnauthorizedPage: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-ivory-200 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-serif font-bold text-charcoal-900 mb-2">
          Access Restricted
        </h1>
        <p className="text-xs text-charcoal-600 leading-relaxed mb-6">
          Your administrative account does not possess the permissions required to view or manage
          this resource.
        </p>

        {admin && (
          <div className="p-4 bg-ivory-50 rounded-xl border border-ivory-200 text-left mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-500 font-medium">Logged in as:</span>
              <span className="font-semibold text-charcoal-900">{admin.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-500 font-medium">Assigned Role:</span>
              <StatusBadge status={admin.role?.slug || 'unknown'} size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-500 font-medium">Role Name:</span>
              <span className="text-charcoal-700 font-medium">
                {formatRoleName(admin.role?.slug || '')}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/dashboard')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
};
