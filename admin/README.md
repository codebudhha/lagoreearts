# Lagoree Arts — Admin Web Application (Phase 1)

Luxury-heritage e-commerce administrative web application for **Lagoree Arts**.

Built with:
- **React 18** & **TypeScript** (Strict Mode)
- **Vite 6** (Fast HMR & Optimized Bundling)
- **Tailwind CSS** (Custom Luxury Tokens: Ivory `#FBF9F5`, Charcoal `#1C1917`, Champagne `#B48B57`)
- **React Router v6** (Nested Layouts, Protected Routes, Role Permissions)
- **TanStack Query v5** (Optimized Server-State Management & Caching)
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
│   │   ├── feedback/
│   │   │   ├── Alert.tsx        # Styled contextual banners
│   │   │   ├── ConfirmDialog.tsx # Modal confirmation for actions
│   │   │   ├── EmptyState.tsx   # Zero-state placeholder with action CTA
│   │   │   ├── ErrorState.tsx   # Error state recovery
│   │   │   ├── Skeleton.tsx     # Loading placeholders
│   │   │   ├── Spinner.tsx      # Multi-variant loading spinners
│   │   │   └── Toast.tsx        # Toast notifications
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx  # Master shell (Desktop & Mobile)
│   │   │   ├── Breadcrumbs.tsx  # Automatic breadcrumb derivation
│   │   │   ├── Header.tsx       # Top navbar with user profile dropdown
│   │   │   ├── ModulePlaceholder.tsx # Phase 2+ placeholders
│   │   │   ├── PageContainer.tsx # Consistent content layout wrapper
│   │   │   └── Sidebar.tsx      # Collapsible sidebar with RBAC filtering
│   │   └── ui/
│   │       ├── Badge.tsx        # Tag and category badges
│   │       ├── Button.tsx       # Luxury button with spinner and icons
│   │       ├── Card.tsx         # Card container with compound subcomponents
│   │       ├── Checkbox.tsx     # Styled checkbox
│   │       ├── DataTable.tsx    # Generic table with search, pagination & empty state
│   │       ├── Drawer.tsx       # Slide-out modal drawer
│   │       ├── Dropdown.tsx     # Accessible context/profile menu
│   │       ├── Input.tsx        # Styled input with icons & validation
│   │       ├── Modal.tsx        # Dialog box modal with backdrop
│   │       ├── Pagination.tsx   # Smart page pagination controls
│   │       ├── SearchInput.tsx  # Search input with debounce support
│   │       ├── Select.tsx       # Dropdown select
│   │       ├── StatusBadge.tsx  # Auto-colored status badge
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
│   │       └── DashboardPage.tsx # Master metric overview & quick launch
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth context consumer
│   │   ├── useBreadcrumbs.ts   # Breadcrumb path resolver
│   │   ├── useDebounce.ts      # Debouncing hook
│   │   ├── useLocalStorage.ts  # Persistent storage hook
│   │   └── useToast.ts         # Toast notifications hook
│   ├── lib/
│   │   ├── api/
│   │   │   ├── auth.ts         # Authentication API calls
│   │   │   ├── client.ts       # Fetch client with 401 refresh interception
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
│   └── admin-phase1.test.mjs   # RBAC and formatting test suite
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

# Run unit / integration test suite
npm run test
```

---

## 🔒 Security & Authorization

- **In-Memory Access Tokens**: Access tokens are stored exclusively in memory.
- **Silent Refresh**: On refresh, an HttpOnly cookie automatically recovers session tokens via `/api/v1/admin/auth/refresh`.
- **401 Interception**: Automatic retry queue refreshes tokens transparently.
- **RBAC**: Supports `SUPER_ADMIN`, `CATALOGUE_MANAGER`, `CONTENT_MANAGER`, `ORDER_MANAGER`, and `MARKETING_MANAGER`.
