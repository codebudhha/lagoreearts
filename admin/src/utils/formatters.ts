export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function formatRoleName(roleSlug: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    CATALOGUE_MANAGER: 'Catalogue Manager',
    CONTENT_MANAGER: 'Content Manager',
    ORDER_MANAGER: 'Order Manager',
    MARKETING_MANAGER: 'Marketing Manager'
  };
  return map[roleSlug] || roleSlug.replace(/_/g, ' ');
}
