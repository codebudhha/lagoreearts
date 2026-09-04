# Lagoree Arts — Admin Web Application (Phase 5: Collection Management)

Luxury-heritage administrative web application for **Lagoree Arts**.

Built with:
- **React 18** & **TypeScript** (Strict Mode)
- **Vite 6** (Fast HMR & Optimized Bundling)
- **Tailwind CSS** (Custom Luxury Tokens: Ivory `#FBF9F5`, Charcoal `#1C1917`, Champagne `#B48B57`, Gold `#D4AF37`)
- **React Router v6** (Nested Layouts, Protected Routes, Role Permissions)
- **TanStack Query v5** (Optimized Server-State Management, Query Keys, Cache Invalidation)
- **React Hook Form** (Form Validation, Unsaved State Guards & Dirty Tracking)
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
│   │   ├── collections/
│   │   │   ├── CollectionMediaManager.tsx # Cover/banner & auxiliary media gallery manager
│   │   │   ├── CollectionPreview.tsx # Storefront simulation with desktop/mobile switcher
│   │   │   ├── CollectionProductManager.tsx # Assigned artworks table, search & safe dissociation
│   │   │   ├── CollectionStatusBadge.tsx # ACTIVE/INACTIVE & Featured indicator badge
│   │   │   ├── CollectionTypeBadge.tsx # MANUAL vs. SYSTEM collection badge with lock icon
│   │   │   └── ProductPicker.tsx # Searchable paginated modal with multi-select assignment
│   │   ├── categories/
│   │   │   ├── CategoryAttributeManager.tsx # Attribute bindings manager
│   │   │   ├── CategorySelector.tsx # Parent category picker with cycle prevention
│   │   │   ├── CategoryStatusBadge.tsx # Status badge
│   │   │   ├── CategoryTree.tsx # Interactive visual taxonomy hierarchy
│   │   │   ├── FilterPreview.tsx # Live storefront facet preview
│   │   │   └── HierarchyBreadcrumb.tsx # Ancestor trail
│   │   ├── attributes/
│   │   │   ├── AttributeFormModal.tsx # Create/edit attribute modal
│   │   │   ├── AttributeTypeBadge.tsx # Semantic data type badge
│   │   │   ├── AttributeValueManager.tsx # Option values CRUD with reordering
│   │   │   └── SystemAttributeBadge.tsx # System protection badge
│   │   ├── dashboard/
│   │   │   ├── ActivityFeed.tsx # Administrative activity and audit view
│   │   │   ├── LowStockList.tsx # Authoritative low inventory alerts
│   │   │   ├── QuickActions.tsx # Permission-aware quick action cards
│   │   │   ├── RecentCustomersList.tsx # Recent patron accounts
│   │   │   ├── RecentOrdersTable.tsx # Compact orders and payment statuses
│   │   │   ├── RecentReviewsList.tsx # Testimonials and ratings moderation
│   │   │   └── StatCard.tsx     # Stat cards with secondary info
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
│   │   │   ├── ModulePlaceholder.tsx # Future phase placeholders
│   │   │   ├── PageContainer.tsx # Consistent content layout wrapper
│   │   │   ├── PageHeader.tsx   # Enhanced header with permission-checked actions
│   │   │   └── Sidebar.tsx      # Collapsible sidebar with RBAC filtering
│   │   ├── products/
│   │   │   ├── CategoryTreeSelector.tsx # Hierarchical taxonomy selector
│   │   │   ├── CollectionMultiSelector.tsx # Multi-collection assignment chips
│   │   │   ├── ProductAttributeEditor.tsx # Dynamic category-bound specification attributes
│   │   │   ├── ProductMediaManager.tsx # Gallery management, primary image & reordering
│   │   │   ├── ProductStatusControl.tsx # Lifecycle status transitions
│   │   │   ├── ProductVariantManager.tsx # Matrix manager for variable artwork editions
│   │   │   ├── SeoEditor.tsx    # SERP Google preview and OpenGraph editor
│   │   │   └── UnsavedChangesDialog.tsx # Modal confirmation for unsaved form state
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
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx    # Admin login screen
│   │   │   ├── ProfilePage.tsx  # User profile & password management
│   │   │   └── UnauthorizedPage.tsx # 403 Forbidden access barrier
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx # Master operational dashboard
│   │   ├── collections/
│   │   │   ├── CollectionListPage.tsx # Table, search, status/type/featured filters & quick sort
│   │   │   ├── CollectionCreatePage.tsx # Tabbed create form (General, Merchandising, Media, SEO)
│   │   │   ├── CollectionDetailPage.tsx # Overview, Products, Media, SEO & Storefront Preview tabs
│   │   │   └── CollectionEditPage.tsx # Edit form with system collection attribute protection
│   │   ├── categories/
│   │   │   ├── CategoryListPage.tsx # Tree/Table views, search & status filters
│   │   │   ├── CategoryCreatePage.tsx # Create form with hierarchy & SEO
│   │   │   ├── CategoryDetailPage.tsx # Detail overview, attributes & facet preview
│   │   │   └── CategoryEditPage.tsx # Edit form with cycle prevention
│   │   ├── attributes/
│   │   │   ├── AttributeListPage.tsx # List view with system badges & type filter
│   │   │   ├── AttributeCreatePage.tsx # Create attribute form
│   │   │   ├── AttributeDetailPage.tsx # Detail overview & values manager
│   │   │   └── AttributeEditPage.tsx # Edit attribute form
│   │   └── products/
│   │       ├── ProductListPage.tsx # Table, search, multi-filters, mobile card representation
│   │       ├── ProductCreatePage.tsx # Comprehensive create form with tabs & unsaved guard
│   │       ├── ProductDetailPage.tsx # Tabbed detail inspection & quick merchandising toggles
│   │       ├── ProductEditPage.tsx # Edit form with dirty tracking & read-only enforcement
│   │       └── ProductPreviewPage.tsx # Customer storefront simulation with cost masking
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth context consumer
│   │   ├── useBreadcrumbs.ts   # Breadcrumb path resolver
│   │   ├── useCollections.ts   # Master Collection TanStack Query & mutation hooks
│   │   ├── useCategories.ts    # Categories query & mutation hooks
│   │   ├── useAttributes.ts    # Attributes & values hooks
│   │   ├── useDashboard.ts     # TanStack Query hooks for stats & recent records
│   │   ├── useDebounce.ts      # Debouncing hook (250-300ms)
│   │   ├── useLocalStorage.ts  # Persistent storage hook
│   │   ├── useProductMedia.ts  # Media gallery attachment query & mutations
│   │   ├── useProductSeo.ts    # SEO metadata query & mutations
│   │   ├── useProducts.ts      # Master product query & CRUD mutations
│   │   ├── useProductVariants.ts # Options, values & variant matrix mutations
│   │   ├── useToast.ts         # Toast notifications hook
│   │   └── useUnsavedChanges.ts # Unsaved changes guard & beforeunload blocker
│   └── lib/
│       ├── api/
│       │   ├── attributes.ts   # Attributes & values API client
│       │   ├── auth.ts         # Authentication API client
│       │   ├── categories.ts   # Category tree & category attributes API client
│       │   ├── client.ts       # Central fetch client with token refresh & retry queue
│       │   ├── collections.ts  # Curated collections API client
│       │   ├── customers.ts    # Customers API client
│       │   ├── media.ts        # Media library & product media API client
│       │   ├── orders.ts       # Orders API client
│       │   ├── products.ts     # Products CRUD & merchandising API client
│       │   ├── queryKeys.ts    # Centralized TanStack Query key factories
│       │   ├── reviews.ts      # Reviews API client
│       │   ├── seo.ts          # SEO metadata API client
│       │   ├── types.ts        # API response envelope types
│       │   └── variants.ts     # Product options & variants API client
│       └── permissions/
│           └── permissionHelpers.ts # Matrix authorization utilities
│   ├── tests/
│   │   ├── admin-phase1.test.mjs   # RBAC and formatting test suite (3 tests)
│   │   ├── admin-phase2.test.mjs   # Dashboard & Global Component test suite (22 tests)
│   │   ├── admin-phase3.test.mjs   # Product Management test suite (64 tests)
│   │   ├── admin-phase4.test.mjs   # Category & Attribute Management test suite (68 tests)
│   │   └── admin-phase5.test.mjs   # Collection Management test suite (68 tests)
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

# Run TypeScript typecheck (0 errors)
npm run typecheck

# Build for production
npm run build

# Run complete test suite (Phases 1-5: 225 automated unit & integration tests passing 100%)
npm run test
```

---

## 🔒 Security & Authorization

- **In-Memory Access Tokens**: Access tokens are stored exclusively in memory.
- **Silent Refresh**: On refresh, an HttpOnly cookie automatically recovers session tokens via `/api/v1/admin/auth/refresh`.
- **401 Interception**: Automatic retry queue refreshes tokens transparently.
- **RBAC**: Supports `SUPER_ADMIN`, `CATALOGUE_MANAGER`, `CONTENT_MANAGER`, `ORDER_MANAGER`, and `MARKETING_MANAGER`.
- **System Collection Locks**: Core system collections cannot be deleted and type conversions are guarded.
- **Safe Dissociation**: Removing a product from a collection dissociates the curation link without deleting the underlying product entity.
- **Cost Price Confidentiality**: `costPrice` is strictly hidden on customer storefront previews and read-only non-authorized screens.
- **Unsaved Changes Guard**: Prevents accidental data loss across internal client-side navigation and external window closing (`beforeunload`).
