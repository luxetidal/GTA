# GTA RP Business Management Web App

## Overview
A comprehensive business management system for GTA roleplay servers. This application allows in-game businesses (dealerships, stores, restaurants, garages, nightclubs) to manage their operations through a web interface, including tracking sales, inventory, employees, and generating invoices.

## Recent Changes
- December 4, 2025: Initial implementation with full MVP features
  - User authentication via Replit Auth (Google, GitHub, email/password)
  - Business CRUD operations with API key generation for FiveM integration
  - Product/Inventory management with low stock alerts
  - Sales recording with automatic invoice generation
  - Employee management with role-based access
  - Dashboard with real-time statistics
  - Dark mode support

## Technology Stack
- **Frontend**: React 18+ with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Routing**: wouter for client-side routing
- **State Management**: TanStack Query v5

## Project Architecture

### Frontend (`client/src/`)
- `App.tsx` - Main application with routing and authentication state
- `components/` - Reusable UI components
  - `ThemeProvider.tsx` - Dark/light mode management
  - `ThemeToggle.tsx` - Theme toggle button
  - `AppSidebar.tsx` - Navigation sidebar
- `pages/` - Page components
  - `Landing.tsx` - Public landing page
  - `Dashboard.tsx` - Main dashboard with stats
  - `Businesses.tsx` - Business management
  - `Inventory.tsx` - Product management
  - `Sales.tsx` - Sales list
  - `NewSale.tsx` - Create new sale form
  - `Invoices.tsx` - Invoice list
  - `InvoiceDetail.tsx` - Single invoice view/print
  - `Employees.tsx` - Employee management
  - `Settings.tsx` - User settings
- `hooks/` - Custom React hooks
  - `useAuth.ts` - Authentication state hook
- `lib/` - Utility functions
  - `queryClient.ts` - TanStack Query configuration
  - `authUtils.ts` - Authentication helpers

### Backend (`server/`)
- `index.ts` - Server entry point
- `routes.ts` - API route definitions
- `storage.ts` - Database operations (DatabaseStorage class)
- `db.ts` - Drizzle database connection
- `replitAuth.ts` - Replit Auth setup

### Shared (`shared/`)
- `schema.ts` - Drizzle ORM schema and TypeScript types

## Database Schema
- `users` - User accounts (synced with Replit Auth)
- `sessions` - User sessions
- `businesses` - Business entities with API keys
- `business_employees` - Employee assignments
- `products` - Inventory items
- `sales` - Sale transactions
- `sale_items` - Individual items in a sale
- `invoices` - Generated invoices

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout user

### Businesses
- `GET /api/businesses` - List user's businesses
- `GET /api/businesses/:id` - Get business details
- `POST /api/businesses` - Create business
- `PATCH /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - List sales
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create sale with items

### Invoices
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice details
- `PATCH /api/invoices/:id` - Update invoice status

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Add employee by email
- `DELETE /api/employees/:id` - Remove employee

### FiveM Integration
- `POST /api/game/sales` - Create sale from game (API key auth)

## FiveM Integration

Each business has a unique API key for FiveM server integration. Example Lua code:

```lua
PerformHttpRequest("https://YOUR_APP_URL/api/game/sales",
  function(err, text, headers)
    local result = json.decode(text)
    if result.success then
      print("Sale recorded: " .. result.invoiceNumber)
    end
  end,
  'POST',
  json.encode({
    businessApiKey = "YOUR_BUSINESS_API_KEY",
    buyerName = playerName,
    items = {
      { productId = "product_uuid", quantity = 1 }
    }
  }),
  { ['Content-Type'] = 'application/json' }
)
```

## User Preferences
- Dark mode preference saved in localStorage
- Role-based access: owner, manager, employee
- Each user can own multiple businesses or be an employee at multiple businesses

## Running the Application
The application runs on port 5000 with the `npm run dev` command which starts both the Express backend and Vite frontend dev server.

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit project ID (for auth)
- `ISSUER_URL` - OIDC issuer URL (defaults to Replit)
