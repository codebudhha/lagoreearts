# Lagoree Arts — Admin Web Application (Phase 2: Dashboard & Global Admin Components)

Luxury-heritage administrative web application for **Lagoree Arts**.

Built with:
- **React 18** & **TypeScript** (Strict Mode)
- **Vite 6** (Fast HMR & Optimized Bundling)
- **Tailwind CSS** (Custom Luxury Tokens: Ivory `#FBF9F5`, Charcoal `#1C1917`, Champagne `#B48B57`)
- **React Router v6** (Nested Layouts, Protected Routes, Role Permissions)
- **TanStack Query v5** (Optimized Server-State Management, Query Keys, Cache Invalidation)
- **React Hook Form** (Form Validation & State Management)
- **Lucide React** (Crisp, High-Precision Icons)

---

## 🏛️ Architecture & Directory Layout

```
admin/
├── src/
│   ├── app/
│   │   ├── App.tsx             # Root application provider wrapper
│   │   └── router.tsx          # Master route hierarchy and RBAC guards
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Can.tsx          # Declarative permission check component
│   │   │   └── ProtectedRoute.tsx # Route protection and role barrier
│   │   ├── dashboard/
│   │   │   ├── ActivityFeed.tsx # Administrative activity and audit view
│   │   │   ├── LowStockList.tsx # Authoritative low inventory alerts
│   │   │   ├── QuickActions.tsx # Permission-aware quick action cards
│   │   │   ├── RecentCustomersList.tsx # Recent patron accounts
│   │   │   ├── RecentOrdersTable.tsx # Compact orders and payment statuses
│   │   │   ├── RecentReviewsList.tsx # Testimonials and ratings moderation
│   │   │   └── StatCard.tsx     # Stat cards with static secondary info
│   │   ├── feedback/
│   │   │   ├── Alert.tsx        # Styled contextual banners
│   │   │   ├── ConfirmDialog.tsx # Modal confirmation for actions
│   │   │   ├── EmptyState.tsx   # Zero-state placeholder with action CTA
│   │   │   ├── ErrorState.tsx   # Error state recovery
│   │   │   ├── Skeleton.tsx     # Loading placeholders
│   │   │   ├── Spinner.tsx      # Multi-variant loading spinners
│   │   │   └── Toast.tsx        # Toast notifications
│   │   ├── global/
│   │   │   ├── CommandPalette.tsx # Ctrl+K global navigation & action search
│   │   │   └── NotificationCenter.tsx # Notification center panel & unread badge
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx  # Master shell (Desktop & Mobile)
│   │   │   ├── Breadcrumbs.tsx  # Automatic breadcrumb derivation
│   │   │   ├── Header.tsx       # Top navbar with Command Palette & Notifications
│   │   │   ├── ModulePlaceholder.tsx # Phase 3+ placeholders
│   │   │   ├── PageContainer.tsx # Consistent content layout wrapper
│   │   │   ├── PageHeader.tsx   # Enhanced header with permission-checked actions
│   │   │   └── Sidebar.tsx      # Collapsible sidebar with RBAC filtering
│   │   └── ui/
│   │       ├── Badge.tsx        # Tag and category badges
│   │       ├── Button.tsx       # Luxury button with spinner and icons
│   │       ├── Card.tsx         # Card container with compound subcomponents
│   │       ├── Checkbox.tsx     # Styled checkbox
│   │       ├── DataTable.tsx    # Generic table with search, pagination & empty state
│   │       ├── Drawer.tsx       # Slide-out modal drawer
│   │       ├── Dropdown.tsx     # Accessible context/profile menu
│   │       ├── FilterBar.tsx    # Reusable search and multi-select filter toolbar
│   │       ├── Input.tsx        # Styled input with icons & validation
│   │       ├── Modal.tsx        # Dialog box modal with backdrop
│   │       ├── Pagination.tsx   # Smart page pagination controls
│   │       ├── SearchInput.tsx  # Search input with debounce support
│   │       ├── Select.tsx       # Dropdown select
│   │       ├── StatusBadge.tsx  # Semantic status badge mapping across domains
│   │       ├── Switch.tsx       # Toggle switch
│   │       ├── Table.tsx        # Core table subcomponents
│   │       ├── Tabs.tsx         # Pill & Line navigation tabs
│   │       ├── Textarea.tsx     # Textarea input
│   │       └── Tooltip.tsx      # Hover tooltip
│   ├── config/
│   │   └── navigation.ts       # Centralized navigation configuration
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx    # Admin login screen
│   │   │   ├── ProfilePage.tsx  # User profile & password management
│   │   │   └── UnauthorizedPage.tsx # 403 Forbidden access barrier
│   │   └── dashboard/
│   │       └── DashboardPage.tsx # Master operational dashboard
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth context consumer
│   │   ├── useBreadcrumbs.ts   # Breadcrumb path resolver
│   │   ├── useDashboard.ts     # TanStack Query hooks for stats & recent records
│   │   ├── useDebounce.ts      # Debouncing hook (250-300ms)
│   │   ├── useLocalStorage.ts  # Persistent storage hook
│   │   └── useToast.ts         # Toast notifications hook
│   ├── lib/
│   │   ├── api/
│   │   │   ├── auth.ts         # Authentication API calls
│   │   │   ├── client.ts       # Fetch client with 401 refresh interception
│   │   │   ├── customers.ts    # Customers API client
│   │   │   ├── orders.ts       # Orders API client
│   │   │   ├── products.ts     # Products API client
│   │   │   ├── queryKeys.ts    # Centralized TanStack Query key factories
│   │   │   ├── reviews.ts      # Reviews API client
│   │   │   └── types.ts        # API response envelope types
│   │   └── permissions/
│   │       └── permissionHelpers.ts # Matrix authorization utilities
│   ├── providers/
│   │   ├── AuthProvider.tsx    # Auth session and token lifecycle
│   │   ├── QueryProvider.tsx   # React Query client
│   │   └── ToastProvider.tsx   # Toast state manager
│   ├── types/
│   │   ├── auth.ts             # User, role & permission interfaces
│   │   ├── navigation.ts       # Nav config & breadcrumb interfaces
│   │   └── ui.ts               # Component prop types
│   └── utils/
│       ├── cn.ts               # clsx + tailwind-merge helper
│       └── formatters.ts       # INR currency, date & role name formatting
├── tests/
│   ├── admin-phase1.test.mjs   # RBAC and formatting test suite
│   └── admin-phase2.test.mjs   # 22-point Dashboard & Global Component test suite
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Available Scripts

From the `admin` directory:

```bash
# Start development server
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Build for production
npm run build

# Run unit / integration test suite (Phase 1 + Phase 2)
npm run test
```

---

## 🔒 Security & Authorization

- **In-Memory Access Tokens**: Access tokens are stored exclusively in memory.
- **Silent Refresh**: On refresh, an HttpOnly cookie automatically recovers session tokens via `/api/v1/admin/auth/refresh`.
- **401 Interception**: Automatic retry queue refreshes tokens transparently.
- **RBAC**: Supports `SUPER_ADMIN`, `CATALOGUE_MANAGER`, `CONTENT_MANAGER`, `ORDER_MANAGER`, and `MARKETING_MANAGER`.
- **Permission-Aware Dashboard**: Metric cards, operational tables, inventory alerts, and quick actions are conditionally rendered only for staff granted matching backend permissions.
- **Global Command Palette**: Accessible via `Ctrl+K` / `Cmd+K` with automatic permission-gated command indexing.
