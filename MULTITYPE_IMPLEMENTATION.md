# Multi-Type POS System - Implementation Guide

## ✅ COMPLETED IN THIS SESSION

### 1. Database Schema Updated (`prisma/schema.prisma`)
- ✅ Added `BusinessType` enum (RETAIL, RESTAURANT, PHARMACY, GYM)
- ✅ Added `MembershipStatus` enum
- ✅ Added `TableStatus` enum
- ✅ Created `Store` model with multi-type support
- ✅ Updated `User` model with storeId and role (owner/cashier)
- ✅ Updated `Product` model with storeId, expiryDate (pharmacy support)
- ✅ Created `Membership` model (gym support)
- ✅ Created `RestaurantTable` model (restaurant support)
- ✅ Updated `Sale` model with storeId, paymentMethod, tableId

### 2. Business Type Configuration (`lib/business-types.ts`)
- ✅ Business type constants and labels
- ✅ Feature flags for each business type
- ✅ Dashboard card configuration per type

### 3. Enhanced Registration Page (`app/register/page.tsx`)
- ✅ Business type selection (4-button grid)
- ✅ Store name input
- ✅ Owner name input
- ✅ Email and password fields
- ✅ Beautiful gradient UI design
- ✅ Validation for all fields

### 4. Updated Registration API (`app/api/auth/register/route.ts`)
- ✅ Multi-type registration endpoint
- ✅ Store creation with business type
- ✅ User-Store relationship setup
- ✅ Transaction-based creation (atomic)
- ✅ Proper error handling

---

## 🚀 NEXT STEPS TO IMPLEMENT

### Phase 1: Database Migration (RUN FIRST)
```bash
# Generate and run migration
npx prisma migrate dev --name init_multitype_pos

# Seed the database (if needed)
npm run seed
```

**Note**: This will reset your database since you're changing the schema significantly. Back up any important data first.

### Phase 2: Update Login API
Need to update `/api/auth/login/route.ts` to:
- Return store information with login response
- Set `storeId` in session payload

### Phase 3: Create Multi-Type Dashboard
Components needed:
- `components/TypeSpecificDashboard.tsx` - Conditional rendering based on `store.businessType`
- Dynamic cards based on business type
- Type-specific metrics

### Phase 4: Update All API Endpoints
All endpoints need `storeId` parameter:
- `/api/products` - filter by storeId
- `/api/sales` - create sale for specific store
- `/api/reports` - calculate reports per store
- `/api/memberships` - gym memberships (new)
- `/api/tables` - restaurant table management (new)

### Phase 5: Create Type-Specific Pages

#### For Retail/Pharmacy:
- Products page with barcode support
- Expiry date tracking (pharmacy)
- Low stock alerts

#### For Restaurant:
- Menu management page
- Table management page
- Table occupancy dashboard

#### For Gym:
- Membership management page
- Active members dashboard
- Membership renewal tracking

### Phase 6: Update Components
- Sidebar nav - hide/show items based on business type
- Cart panel - conditional table selection for restaurants
- Product form - conditional expiry date field for pharmacy

---

## 📋 Critical Files to Update

### Authentication Flow
```
✅ /app/register/page.tsx           - DONE
✅ /app/api/auth/register/route.ts  - DONE
⏳ /app/api/auth/login/route.ts     - NEEDS UPDATE
⏳ /lib/auth.ts                     - May need store context
```

### API Endpoints (All Need storeId)
```
⏳ /app/api/products/route.ts
⏳ /app/api/products/[id]/route.ts
⏳ /app/api/sales/route.ts
⏳ /app/api/reports/route.ts
🆕 /app/api/memberships/route.ts
🆕 /app/api/tables/route.ts
```

### Pages (All Need Type-Awareness)
```
⏳ /app/dashboard/page.tsx
⏳ /app/products/page.tsx
⏳ /app/sales/page.tsx
⏳ /app/reports/page.tsx
🆕 /app/memberships/page.tsx
🆕 /app/tables/page.tsx
```

### Components (Type-Conditional)
```
⏳ /components/Sidebar.tsx           - Hide/show menu items
⏳ /components/CartPanel.tsx         - Add table selection for restaurants
🆕 /components/ProductForm.tsx       - Add expiry date field
🆕 /components/RestaurantTableCard.tsx
🆕 /components/MembershipCard.tsx
```

---

## 🔧 Implementation Priority

### Tier 1 (MUST DO FIRST)
1. Run database migration
2. Update login API to return store info
3. Update middleware to capture storeId from session
4. Test basic registration + login flow

### Tier 2 (CORE FUNCTIONALITY)
5. Add storeId to all API endpoints
6. Update products endpoint to filter by store
7. Update sales endpoint to use store
8. Update reports endpoint to calculate per store

### Tier 3 (FEATURE-SPECIFIC)
9. Create membership endpoints (gym)
10. Create table management endpoints (restaurant)
11. Add expiry tracking to products (pharmacy)

### Tier 4 (UI/UX)
12. Create type-specific dashboard
13. Update navigation based on business type
14. Add type-specific pages (memberships, tables)
15. Beautiful type-aware component rendering

---

## 💾 Database Migration Steps

```bash
# Go to your project directory
cd d:\ALLFORME\POS

# Create migration with the new schema
npx prisma migrate dev --name init_multitype_pos

# This will:
# - Generate migration files
# - Reset database (⚠️ WARNING: Deletes existing data)
# - Run migration
# - Regenerate Prisma client
```

If you want to save existing data, use:
```bash
npx prisma migrate resolve --applied "init_multitype_pos"
```

---

## 🔐 Security Considerations

- Store ownership is now defined by User.role = 'owner'
- Users can only see data for their assigned storeId
- API endpoints MUST validate user.storeId matches requested data
- Middleware needs to enforce storeId isolation

Update middleware to add storeId check:
```ts
// In middleware.ts - add store isolation check
if (session && pathname.startsWith('/api')) {
  response.headers.set('X-Store-ID', user.storeId.toString())
  // Verify API calls use matching storeId
}
```

---

## 📱 Responsive Design Considerations

- Registration form: 2-column business type grid → 1-column on mobile
- Dashboard: 4-card grid → responsive stack
- Table management: Grid layout responsive to screen size
- Membership list: Table on desktop → card list on mobile

---

## 🧪 Testing Checklist

After each phase, test:
- [ ] Registration with all 4 business types
- [ ] Login returns store information
- [ ] Products created for specific store only
- [ ] Sales recorded to correct store
- [ ] Reports filter by store
- [ ] Existing data doesn't leak between stores
- [ ] UI renders correctly for each business type
- [ ] Mobile responsive on all pages
- [ ] Permission checks work (store isolation)

---

## 📚 Code Examples

### Using Store Info in Components
```tsx
// In a component
const session = await getSession()
const storeId = session?.user?.store?.id
const businessType = session?.user?.store?.businessType

// Conditional rendering
{businessType === 'GYM' && <MembershipPanel />}
{businessType === 'RESTAURANT' && <TableManagement />}
{businessType === 'PHARMACY' && <ExpiryTracking />}
```

### Updated API Endpoint Pattern
```ts
// In API route
const storeId = parseInt(request.headers.get('X-Store-ID') || '0')

const products = await prisma.product.findMany({
  where: { storeId },
})
```

---

## 🎯 Next Session Tasks

Once you decide to continue with this upgrade:

1. **Run Migration** - Execute Prisma migration
2. **Update Login API** - Include store in session
3. **Test Registration** - Register with each business type
4. **Update All Endpoints** - Add storeId filtering
5. **Create Dashboard** - Type-aware dashboard component
6. **Build Type-Specific Pages** - Memberships, tables, etc.
7. **Full Testing** - Complete security and functionality tests

---

## 📞 Common Issues & Solutions

### Issue: "Prisma schema validation error"
→ Ensure all 4 BusinessType values match database enum

### Issue: "User cannot access store data"
→ Add storeId to middleware headers and verify in API endpoints

### Issue: "Old cashier users have no store"
→ Create a default store or set storeId for legacy users

### Issue: "Mobile layout breaks"
→ Use responsive grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`

---

## 🎓 Learning Resources

This project now includes:
- Multi-tenancy (store isolation)
- Enum-based feature flags
- Transaction-based data creation
- Type-aware UI rendering
- Store-scoped APIs

These are production-grade patterns used by companies like Shopify, Square, and Toast!

---

## Status Summary

**Current Implementation**: 40% Complete
- Database schema: ✅ Done
- Registration flow: ✅ Done
- Core API: ⏳ Pending
- Type-specific pages: ⏳ Pending
- Full testing: ⏳ Pending

**Estimated Time to Complete**: 2-3 hours for full implementation

Would you like me to continue with Phase 2 (Login API update) or help with a specific part?
