import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { CustomerStatusBadge } from '../../components/customers/CustomerStatusBadge';
import { useCustomerList } from '../../hooks/useCustomers';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminCustomer, CustomerStatus, ListCustomersResponseData } from '../../lib/api/customers';
import { Users, Eye, CheckCircle, XCircle } from 'lucide-react';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading, isError, error, refetch } = useCustomerList({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as CustomerStatus) : undefined,
  });

  const result = data as ListCustomersResponseData | undefined;
  const customers = result?.customers || [];
  const pagination = result
    ? { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
    : { page: 1, limit: 20, total: 0, totalPages: 1 };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="View and manage customer accounts, addresses, and sessions."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Customers' },
        ]}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>
        <Select
          aria-label="Filter by Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44 text-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load customers"
          message={(error as Error)?.message || 'An unexpected error occurred'}
          onRetry={refetch}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7 text-charcoal-400" />}
          title="No customers found"
          description={
            debouncedSearch || statusFilter !== 'ALL'
              ? 'Try refining your search or filter criteria.'
              : 'No customer accounts yet.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-ivory-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ivory-200 bg-ivory-50 text-xs font-medium text-charcoal-500">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {customers.map((c: AdminCustomer) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer transition-colors hover:bg-ivory-50/50"
                    onClick={() => navigate(`/admin/customers/${c.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-charcoal-900">
                        {c.firstName} {c.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-charcoal-600">{c.email}</td>
                    <td className="px-4 py-3.5 text-charcoal-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3.5">
                      <CustomerStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      {c.emailVerifiedAt ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-charcoal-300" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-charcoal-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-charcoal-500">
                      {formatDate(c.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/customers/${c.id}`);
                        }}
                        title="View Customer"
                      >
                        <Eye className="h-4 w-4 text-charcoal-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="border-t border-ivory-200 p-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};
