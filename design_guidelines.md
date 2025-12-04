# GTA RP Business Management Web App - Design Guidelines

## Design Approach: Metronic Dashboard System

**Selected Framework**: KeenThemes Metronic Tailwind (as explicitly requested in requirements)
**Justification**: Enterprise-grade dashboard template designed for data-intensive business management applications with pre-built components for tables, forms, and navigation patterns.

---

## Core Design Principles

1. **Data-First Hierarchy**: Information density balanced with scanability - users need quick access to sales, inventory, and business metrics
2. **Role-Based UI**: Visual differentiation between owner and employee views while maintaining consistent component structure
3. **Action-Oriented**: Primary actions (Record Sale, Add Product, Generate Invoice) prominently placed and accessible
4. **Trust & Professionalism**: Clean, organized layouts that convey reliability for financial transactions

---

## Typography System

**Font Stack**: Inter (via Google Fonts CDN) - excellent readability for data tables and forms

**Hierarchy**:
- Page Headers: text-2xl font-semibold (Dashboard titles, Business names)
- Section Headers: text-xl font-semibold (Widget titles, Table headers)
- Card Titles: text-lg font-medium (Product names, Sale entries)
- Body Text: text-base font-normal (Form labels, Table data)
- Secondary Text: text-sm (Timestamps, Status labels, Helper text)
- Small Labels: text-xs (Badges, Tags, Metadata)

**Line Heights**: leading-tight for headers, leading-normal for body, leading-relaxed for long-form content

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 to p-6
- Section spacing: py-6 to py-8
- Container gaps: gap-4 to gap-6
- Form field spacing: space-y-4

**Grid Structure**:
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Data tables: Full-width containers with horizontal scroll on mobile
- Forms: Single column on mobile, max-w-2xl centered on desktop
- Side navigation: Fixed 64-72 width sidebar on desktop, drawer overlay on mobile

**Container Widths**:
- Main content: max-w-7xl mx-auto
- Forms: max-w-2xl
- Modals: max-w-lg to max-w-3xl depending on content

---

## Component Library

### Navigation
- **Top Bar**: Fixed header (h-16) with business selector dropdown, user profile menu, notifications icon
- **Sidebar**: Collapsible navigation (hidden on mobile) with icon + label menu items, grouped by function (Dashboard, Businesses, Sales, Inventory, Reports)
- **Breadcrumbs**: On sub-pages showing navigation path (Dashboard > Business Name > Inventory)

### Dashboard Widgets
- **Stat Cards**: Compact cards showing key metrics (Total Sales Today, Low Stock Items, Pending Invoices) with large numbers and trend indicators
- **Quick Actions**: Grid of prominent action buttons (Record Sale, Add Product, Create Invoice)
- **Recent Activity**: List of latest transactions with timestamps, employee names, and amounts

### Data Tables
- **Structure**: Header row with sortable columns, striped rows (even/odd visual distinction), hover states
- **Actions**: Row-level action buttons (Edit, View, Delete) aligned right
- **Pagination**: Bottom-aligned with page numbers and prev/next controls
- **Search/Filter**: Top-aligned search input and filter dropdowns above table

### Forms
- **Input Fields**: Consistent height (h-10 to h-12), clear labels above inputs, helper text below when needed
- **Dropdowns**: Custom styled selects matching input field aesthetics
- **Date/Time Pickers**: Inline calendar widgets for sales recording
- **Form Actions**: Primary button (Submit, Save) + secondary button (Cancel) aligned right

### Business/Product Cards
- **Structure**: Compact card with image placeholder, title, status badge, key details, and action buttons
- **Layout**: Flexible grid on dashboard, detailed view on individual pages

### Modals/Overlays
- **Confirmation Dialogs**: Centered modal for delete/critical actions with clear yes/no options
- **Detail Views**: Larger modals for invoice previews, sale details with printable format
- **Backdrop**: Semi-transparent overlay (backdrop-blur-sm)

### Status Indicators
- **Badges**: Rounded pill-shaped tags for status (Active, Inactive, Low Stock, Paid, Pending)
- **Icons**: Small inline icons for quick visual scanning (checkmarks, alerts, trends)

---

## Page-Specific Layouts

### Login Page
- Centered card (max-w-md) with logo, form fields, Replit Auth buttons (Google, GitHub, Email/Password)
- Minimal background, focused on authentication action

### Dashboard
- Grid of stat cards (3-4 columns on desktop)
- Quick action buttons in prominent section
- Recent sales table below
- Business selector if user has multiple businesses

### Business Management Page
- Header with business name and edit button
- Tabs for Inventory, Sales History, Employees, Settings
- Content area changes based on active tab
- Consistent table/card layouts within tabs

### Sales Recording Form
- Two-column layout on desktop: Product selection (left) + Order summary (right)
- Product search/dropdown with quantity input
- Running total display
- Buyer information section
- Generate Invoice button (primary CTA)

### Invoice Display
- Printable format with business header, itemized list, totals
- Actions: Print, Download PDF, Copy Link, Mark as Paid
- Professional layout suitable for in-game use

### Inventory Management
- Filterable table with product name, stock level, price, last updated
- Bulk actions toolbar
- Add Product button (top-right primary position)
- Low stock items highlighted visually

### Reports Page
- Date range selector at top
- Chart visualizations for sales trends (if implementing charts)
- Summary metrics
- Exportable data table

---

## Responsive Behavior

**Mobile (<768px)**:
- Sidebar becomes bottom drawer or hamburger menu
- Tables switch to card-based layouts or horizontal scroll
- Forms remain single-column with full-width inputs
- Stat cards stack vertically

**Tablet (768px-1024px)**:
- Two-column layouts where appropriate
- Sidebar remains visible but can collapse
- Tables show key columns, hide secondary info

**Desktop (>1024px)**:
- Full sidebar navigation
- Multi-column dashboards
- Tables show all columns
- Side-by-side form layouts where beneficial

---

## Interaction Patterns

**Loading States**: Skeleton screens for tables, spinner overlays for form submissions
**Empty States**: Helpful illustrations/text when no data exists (e.g., "No sales yet - Record your first sale")
**Success Feedback**: Toast notifications (top-right) for successful actions
**Error Handling**: Inline validation messages on forms, error alerts for failed API calls

---

## Images

**Usage**: Minimal use of images - this is a data-focused dashboard application

**Where to Include**:
- **Business logos**: Small square thumbnails (64x64 to 80x80) in business selector and business cards
- **Product images**: Thumbnail images in inventory tables and sales forms (optional, 48x48 to 64x64)
- **Empty states**: Simple illustrations for "No data" scenarios
- **User avatars**: Small circular avatars (32x32 to 40x40) in top bar and employee lists

**No large hero images** - this is an admin dashboard, not a marketing site. Focus remains on functionality and data presentation.

---

## Accessibility & Performance

- All interactive elements have clear focus states (ring-2 ring-offset-2)
- Form labels properly associated with inputs
- Adequate touch targets on mobile (min 44x44px)
- Semantic HTML throughout
- ARIA labels on icon-only buttons
- Keyboard navigation support for all interactive elements