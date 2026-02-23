# Sari-Sari POS Web Application

A modern, responsive Point of Sale (POS) web application for small retail stores built with Next.js 14, TypeScript, Tailwind CSS, and Prisma ORM.

## 🎯 Features

- **Clean Retail Dashboard** – Summary cards showing today's, weekly, and monthly sales with low stock alerts
- **Product Management** – Full product inventory with barcode tracking, pricing, stock levels, and low-stock thresholds
- **Point of Sale (Checkout)** – Quick-add product selection, real-time cart management with quantity controls, and streamlined checkout
- **Sales Reports** – Filterable sales data (Today, This Week, This Month) with transaction history
- **Cashier Authentication** – Email/password login system
- **Responsive Design** – Works seamlessly on desktop, tablet, and mobile devices
- **Professional UI** – Minimalist design with soft shadows, rounded corners, and clean typography

## 🛠 Tech Stack

- **Frontend Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database ORM:** Prisma
- **Database:** MySQL (PlanetScale or local MySQL)
- **Backend:** Next.js API Route Handlers

## 📋 Project Structure

```
pos-web-app/
├── app/
│   ├── api/
│   │   ├── products/route.ts      # Products API endpoint
│   │   ├── sales/route.ts         # Sales API endpoint
│   │   └── reports/route.ts       # Reports API endpoint
│   ├── dashboard/page.tsx          # Dashboard with summary cards
│   ├── products/page.tsx           # Product inventory management
│   ├── sales/page.tsx              # Checkout interface
│   ├── reports/page.tsx            # Sales reports
│   ├── login/page.tsx              # Cashier login
│   ├── layout.tsx                  # Main layout with sidebar & navbar
│   ├── page.tsx                    # Root redirect
│   └── globals.css                 # Global Tailwind styles
├── components/
│   ├── Card.tsx                    # Reusable card component
│   ├── Table.tsx                   # Reusable table component
│   ├── Modal.tsx                   # Modal dialog component
│   ├── Badge.tsx                   # Status badge component
│   ├── Sidebar.tsx                 # Navigation sidebar
│   ├── Navbar.tsx                  # Top navigation bar
│   ├── ProductForm.tsx             # Product add/edit form modal
│   └── CartPanel.tsx               # Shopping cart panel
├── prisma/
│   └── schema.prisma               # Database schema
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── tailwind.config.js              # Tailwind CSS config
├── postcss.config.cjs              # PostCSS config
├── next.config.js                  # Next.js config
├── .env.example                    # Environment variables template
└── README.md                        # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MySQL 8.0+ (local or PlanetScale cloud)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your database URL:
   ```
   DATABASE_URL="mysql://user:password@localhost:3306/pos_db"
   ```

3. **Initialize Prisma:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed database with demo data (optional):**
   ```bash
   npm run seed
   ```
   This creates demo cashiers, products, and sample sales data.
   
   **Demo Login Credentials:**
   - Email: `maria@sarisar.com` or `juan@sarisar.com`
   - Password: `password123`

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```
   (Redirects to login page)

## 📄 Database Schema

The application uses the following models:

### User
- `id` – Primary key
- `email` – Unique cashier email (login credential)
- `password` – Hashed password
- `name` – Cashier name
- `role` – User role (e.g., "cashier")
- `createdAt` – Account creation timestamp

### Product
- `id` – Primary key
- `name` – Product name
- `barcode` – Unique product barcode
- `price` – Product price
- `stock` – Current stock quantity
- `lowStockThreshold` – Alert threshold for low inventory
- `createdAt`, `updatedAt` – Timestamps

### Sale
- `id` – Primary key
- `cashierId` – Foreign key to User
- `total` – Total sale amount
- `createdAt` – Sale timestamp
- `items` – Related SaleItems

### SaleItem
- `id` – Primary key
- `saleId` – Foreign key to Sale
- `productId` – Foreign key to Product
- `price` – Price at time of sale
- `quantity` – Quantity sold

## 🔌 API Routes (Implemented)

The application includes fully implemented API endpoints with Prisma integration:

### Products API
- `GET /api/products` – Fetch all products (supports `?lowStock=true` filter)
- `POST /api/products` – Create new product (name, barcode, price, stock, lowStockThreshold)

### Sales API
- `GET /api/sales` – Fetch sales records (supports date range filtering)
- `POST /api/sales` – Create new sale with items (automatically updates stock)

### Reports API
- `GET /api/reports?period=today|week|month` – Get sales analytics and summaries

### Authentication API
- `POST /api/auth/login` – Authenticate cashier with email/password

**Full API documentation:** See [API.md](API.md)

## 🔐 Authentication & Security

The app implements:
- **Credential-based authentication** (email/password)
- **Session management** with HTTP-only cookies
- **Route protection** via middleware (automatic redirect to login)
- **API authentication** with bearer tokens or session cookies
- **Password hashing** using scrypt (use bcryptjs for production)

All protected routes automatically redirect to `/login` if not authenticated.

## 🎨 UI Components

### Card Component
Display summary metrics with optional badges:
```tsx
<Card title="Today's Sales" value="" />
<Card title="Low Stock" value="7" highlight />
```

### Table Component
Render sortable, filterable product and transaction tables:
```tsx
<Table columns={["Name", "Price", "Stock"]}>
  {/* rows */}
</Table>
```

### Modal Component
Dialog for forms (products, checkout payment):
```tsx
<Modal open={showForm} onClose={() => setShowForm(false)} title="Add Product">
  {/* form content */}
</Modal>
```

### CartPanel Component
Shopping cart with item management:
```tsx
<CartPanel items={cartItems} setItems={setCartItems} />
```

## 🔐 Authentication

The app uses credential-based (email/password) authentication. Currently, the login page is a UI placeholder. To implement:

1. Hash passwords with `bcrypt`
2. Create `/api/auth/login` endpoint
3. Store session in cookies or JWT
4. Add middleware to protect routes

## 📱 Pages Overview

### Login (`/login`)
- Centered card layout with email/password fields
- Error message placeholder
- Professional retail POS styling

### Dashboard (`/dashboard`)
- 4 summary cards: Today's Sales, Weekly Sales, Monthly Sales, Low Stock Count
- Grid layout (4 cols desktop, stacked mobile)
- Quick overview of key metrics

### Products (`/products`)
- Table with product listing (Name, Barcode, Price, Stock)
- Low stock indicator badge
- Edit/Delete action buttons
- "Add Product" modal with form fields

### Sales / Checkout (`/sales`)
- Two-column layout: Product selector (left), Cart panel (right)
- Quick-add product grid
- Real-time cart with quantity controls
- Total calculation and checkout button

### Reports (`/reports`)
- Filter buttons: Today, This Week, This Month
- Sales summary card placeholder
- Transaction history table placeholder
- Ready for Recharts integration

## 🎯 Design System

- **Colors:** Light theme with soft grays and blue accents
- **Shadows:** `shadow-sm` and `shadow-md` for subtle depth
- **Spacing:** Consistent `p-6` sections and `gap-4` grid spacing
- **Borders:** `rounded-xl` for cards, `rounded-md` for inputs
- **Typography:** Clean sans-serif hierarchy with clear contrast

## 🔄 Next Steps

### ✅ Completed
- ✓ UI/UX with Next.js 14, TypeScript, Tailwind CSS
- ✓ Prisma ORM schema (User, Product, Sale, SaleItem)
- ✓ API endpoints with Prisma queries
- ✓ Authentication and session management
- ✓ Route protection via middleware
- ✓ Database seeding script with demo data

### 🚧 To Complete (Optional Enhancements)
1. **Frontend API Integration:**
   - Connect page `fetch()` calls to API endpoints
   - Add error handling and loading states
   - Implement real-time cart calculations

2. **Advanced Features:**
   - Barcode scanner integration (e.g., QuaggaJS)
   - PDF receipt generation
   - Product image uploads
   - Inventory alerts (low stock notifications)
   - Multi-currency or discounts

3. **Analytics & Reporting:**
   - Charts with Recharts (sales trends, top products)
   - Export reports to CSV/PDF
   - Advanced filtering and date pickers

4. **Database & Deployment:**
   - Set up PlanetScale for production
   - Add database backups and recovery
   - Deploy to Vercel, Railway, or AWS

5. **Testing & QA:**
   - Unit tests (Jest + React Testing Library)
   - Integration tests for API endpoints
   - E2E tests with Cypress or Playwright

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

For deployment, use Vercel (recommended for Next.js):
```bash
npm install -g vercel
vercel
```

## 📝 Notes

- All pages use the shared layout with Sidebar and Navbar
- Components are client-side (`"use client"`) where interactivity is needed
- Sample data is hardcoded for UI testing; replace with API calls
- Tailwind classes use standard utilities; customize in `/tailwind.config.js`

## 🤝 Contributing

This is a scaffold ready for team development. Follow these patterns:
- Use TypeScript for type safety
- Keep components small and focused
- Use Tailwind utilities for styling
- Implement Prisma queries for database access

## 📄 License

MIT – Use freely for personal or commercial projects.

---

Built with ❤️ for modern retail punto de venta solutions.
