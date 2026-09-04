import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { CustomerStatusBadge } from '../../components/customers/CustomerStatusBadge';
import { AddressCard } from '../../components/customers/AddressCard';
import { AddressEditorModal } from '../../components/customers/AddressEditorModal';
import { SessionCard } from '../../components/customers/SessionCard';
import {
  useCustomer,
  useCustomerAddresses,
  useCustomerSessions,
  useUpdateCustomerStatus,
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
  useSetDefaultShippingAddress,
  useSetDefaultBillingAddress,
  useRevokeCustomerSessions,
} from '../../hooks/useCustomers';
import { useAuth } from '../../hooks/useAuth';
import { CustomerAddress, CustomerAddressFormData } from '../../lib/api/customers';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  ShoppingCart,
  Shield,
  AlertTriangle,
  LogOut,
  Edit2,
} from 'lucide-react';

type TabId = 'overview' | 'addresses' | 'sessions';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'sessions', label: 'Sessions' },
];

export const CustomerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddress | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);

  const { data: customer, isLoading, isError, error, refetch } = useCustomer(id);
  const { data: addresses = [], isLoading: addressesLoading } = useCustomerAddresses(id);
  const { data: sessions = [], isLoading: sessionsLoading } = useCustomerSessions(id);

  const updateStatus = useUpdateCustomerStatus();
  const createAddress = useCreateCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const setDefaultShipping = useSetDefaultShippingAddress();
  const setDefaultBilling = useSetDefaultBillingAddress();
  const revokeSessions = useRevokeCustomerSessions();

  const canUpdate = hasPermission('customer.update');
  const canManageStatus = hasPermission('customer.status.update');
  const canManageAddresses = hasPermission('customer.address.update');
  const canRevokeSessions = hasPermission('customer.session.revoke');

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    if (!customer || !id) return;
    await updateStatus.mutateAsync({ id, status: newStatus });
  };

  const handleSaveAddress = async (data: CustomerAddressFormData) => {
    if (!id) return;
    if (editingAddress) {
      await updateAddress.mutateAsync({ customerId: id, addressId: editingAddress.id, data });
    } else {
      await createAddress.mutateAsync({ customerId: id, data });
    }
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete || !id) return;
    await deleteAddress.mutateAsync({ customerId: id, addressId: addressToDelete.id });
    setAddressToDelete(null);
  };

  const handleRevokeAllSessions = async () => {
    if (!id) return;
    await revokeSessions.mutateAsync(id);
    setShowRevokeAll(false);
  };

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !customer) {
    return (
      <PageContainer>
        <ErrorState
          title="Customer not found"
          message={(error as Error)?.message || 'The requested customer could not be loaded.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={customer.email}
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Customers', path: '/admin/customers' },
          { label: `${customer.firstName} ${customer.lastName}` },
        ]}
      >
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/customers/${id}/edit`)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
          {canManageStatus && (
            <>
              {customer.status === 'ACTIVE' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('INACTIVE')}
                    disabled={updateStatus.isPending}
                    className="gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('SUSPENDED')}
                    disabled={updateStatus.isPending}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Shield className="h-4 w-4" />
                    Suspend
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleStatusChange('ACTIVE')}
                  disabled={updateStatus.isPending}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Activate
                </Button>
              )}
            </>
          )}
          {canRevokeSessions && activeSessions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowRevokeAll(true)}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Revoke All Sessions
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="mb-6 border-b border-ivory-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-charcoal-900 text-charcoal-900'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
              }`}
            >
              {tab.label}
              {tab.id === 'addresses' && addresses.length > 0 && (
                <span className="ml-2 rounded-full bg-ivory-200 px-2 py-0.5 text-xs text-charcoal-600">
                  {addresses.length}
                </span>
              )}
              {tab.id === 'sessions' && activeSessions.length > 0 && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  {activeSessions.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <div className="rounded-lg border border-ivory-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-charcoal-900">Customer Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-charcoal-400" />
                <div>
                  <p className="text-sm font-medium text-charcoal-900">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-charcoal-400" />
                <p className="text-sm text-charcoal-600">{customer.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-charcoal-400" />
                <p className="text-sm text-charcoal-600">{customer.phone || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-charcoal-400" />
                <CustomerStatusBadge status={customer.status} />
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-charcoal-400" />
                <p className="text-sm text-charcoal-600">
                  Email verified: {customer.emailVerifiedAt ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="rounded-lg border border-ivory-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-charcoal-900">Account Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-charcoal-400" />
                <div>
                  <p className="text-xs text-charcoal-500">Registered</p>
                  <p className="text-sm text-charcoal-900">{formatDateTime(customer.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-charcoal-400" />
                <div>
                  <p className="text-xs text-charcoal-500">Last Updated</p>
                  <p className="text-sm text-charcoal-900">{formatDateTime(customer.updatedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-charcoal-400" />
                <div>
                  <p className="text-xs text-charcoal-500">Last Login</p>
                  <p className="text-sm text-charcoal-900">
                    {formatDateTime(customer.lastLoginAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-charcoal-400" />
                <div>
                  <p className="text-xs text-charcoal-500">Addresses</p>
                  <p className="text-sm text-charcoal-900">
                    {customer.addressCount ?? addresses.length} address(es)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4 text-charcoal-400" />
                <div>
                  <p className="text-xs text-charcoal-500">Active Sessions</p>
                  <p className="text-sm text-charcoal-900">
                    {customer.sessionCount ?? activeSessions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="rounded-lg border border-ivory-200 bg-white p-6 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-charcoal-900">Quick Summary</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-ivory-50 p-4 text-center">
                <p className="text-2xl font-bold text-charcoal-900">
                  {customer.addressCount ?? addresses.length}
                </p>
                <p className="mt-1 text-xs text-charcoal-500">Addresses</p>
              </div>
              <div className="rounded-lg bg-ivory-50 p-4 text-center">
                <p className="text-2xl font-bold text-charcoal-900">
                  {customer.sessionCount ?? activeSessions.length}
                </p>
                <p className="mt-1 text-xs text-charcoal-500">Active Sessions</p>
              </div>
              <div className="rounded-lg bg-ivory-50 p-4 text-center">
                <p className="text-2xl font-bold text-charcoal-900">
                  {customer.emailVerifiedAt ? 'Yes' : 'No'}
                </p>
                <p className="mt-1 text-xs text-charcoal-500">Email Verified</p>
              </div>
              <div className="rounded-lg bg-ivory-50 p-4 text-center">
                <p className="text-2xl font-bold text-charcoal-900">
                  {formatDate(customer.lastLoginAt)}
                </p>
                <p className="mt-1 text-xs text-charcoal-500">Last Login</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'addresses' && (
        <div>
          {canManageAddresses && (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                Add Address
              </Button>
            </div>
          )}

          {addressesLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-7 w-7 text-charcoal-400" />}
              title="No addresses"
              description="This customer has no saved addresses."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  canEdit={canManageAddresses}
                  onEdit={(a) => {
                    setEditingAddress(a);
                    setIsAddressModalOpen(true);
                  }}
                  onDelete={(a) => setAddressToDelete(a)}
                  onSetDefaultShipping={(a) =>
                    id ? setDefaultShipping.mutateAsync({ customerId: id, addressId: a.id }) : undefined
                  }
                  onSetDefaultBilling={(a) =>
                    id ? setDefaultBilling.mutateAsync({ customerId: id, addressId: a.id }) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div>
          {sessionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={<Shield className="h-7 w-7 text-charcoal-400" />}
              title="No sessions"
              description="This customer has no active or recent sessions."
            />
          ) : (
            <div className="space-y-6">
              {activeSessions.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-charcoal-900">
                    Active Sessions ({activeSessions.length})
                  </h3>
                  <div className="space-y-2">
                    {activeSessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        canRevoke={canRevokeSessions}
                        onRevoke={() => {
                          if (id) revokeSessions.mutateAsync(id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {inactiveSessions.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-charcoal-500">
                    Past Sessions ({inactiveSessions.length})
                  </h3>
                  <div className="space-y-2">
                    {inactiveSessions.map((s) => (
                      <SessionCard key={s.id} session={s} canRevoke={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Address Modal */}
      <AddressEditorModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        address={editingAddress}
        isLoading={createAddress.isPending || updateAddress.isPending}
      />

      {/* Delete Address Confirm */}
      <ConfirmDialog
        isOpen={Boolean(addressToDelete)}
        onClose={() => setAddressToDelete(null)}
        onConfirm={handleDeleteAddress}
        title="Delete Address"
        message={`Are you sure you want to delete this address? ${
          addressToDelete?.isDefaultShipping || addressToDelete?.isDefaultBilling
            ? 'This is a default address — the first remaining address will be promoted to default.'
            : ''
        }`}
        confirmLabel="Delete Address"
        variant="danger"
        isLoading={deleteAddress.isPending}
      />

      {/* Revoke All Sessions Confirm */}
      <ConfirmDialog
        isOpen={showRevokeAll}
        onClose={() => setShowRevokeAll(false)}
        onConfirm={handleRevokeAllSessions}
        title="Revoke All Sessions"
        message={`Revoke all ${activeSessions.length} active session(s) for this customer? They will need to log in again.`}
        confirmLabel="Revoke All"
        variant="danger"
        isLoading={revokeSessions.isPending}
      />
    </PageContainer>
  );
};
