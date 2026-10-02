# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend
```bash
cd backend
npm run server      # nodemon (auto-reload)
npm start           # node server.js (production)
```
Backend runs on port 4000. API docs at `http://localhost:4000/api-docs` (Swagger).

### Frontend
```bash
cd frontend
npm run dev         # Vite dev server (port 5173)
npm run build       # Production build
npm run lint        # ESLint (0 warnings enforced)
npm run preview     # Preview production build
```

### Environment Files
- `backend/.env` — `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `CLIENT_URL`, `ADMIN_CLIENT_URL`, `PORT`
- `frontend/.env` — `VITE_BACKEND_URL`

There is no test suite. Verification is manual via browser or Postman (`Salon-Booking-Full-API.postman_collection.json`).

---

## Architecture Overview

### Monorepo Structure
Three top-level directories: `backend/` (Express + MongoDB), `frontend/` (React + Vite, customer + admin SPA), `admin/` (legacy; largely superseded by the unified frontend).

### Multi-Tenant Model
Every document that belongs to a salon carries a `shopId: String` field (e.g. `"SHOP001"`). All queries must filter by `shopId`. Never omit it — cross-salon data leakage is a recurring failure mode.

Each salon has a `slug` (lowercase, URL-safe) used in all customer-facing routes: `/:shopSlug/*`.

### Backend

**Entry point:** `backend/server.js`  
**Database:** MongoDB via Mongoose (`backend/config/mongodb.js`). ESM throughout (`"type": "module"`).  
**Timezone:** forced to `Asia/Kolkata` at server startup.

**Route → Controller map:**
| Route prefix | Controller file |
|---|---|
| `/api/user` | `userController.js` |
| `/api/salon-admin` | `salonAdminController.js` + `billingController.js` + `discountController.js` + `broadcastController.js` |
| `/api/super-admin` | `superAdminController.js` |
| `/api/shop` | `shopRoute.js` (inline handlers) |
| `/api/doctor` | `doctorController.js` |
| `/api/stylist` | `stylistController.js` |
| `/api/salon-request` | `salonRequestController.js` |

`/api/admin` is **disabled** (legacy single-tenant). All admin operations go through `/api/salon-admin`.

**Authentication middleware** (`backend/middleware/`):
- `authSalonAdmin.js` — reads `satoken` header → sets `req.salonAdmin = { adminId, shopId, name, email, role }`. Always use this for salon-admin-protected routes.
- `authUser.js` — reads `token` header for customers.
- `authSuperAdmin.js` — reads `superadmintoken`.
- `authDoctor.js` — reads `dtoken`.
- `authStylist.js` — reads `stylisttoken`.

**Feature toggles on `shopModel`:**  
Boolean fields gate features per salon: `couponEnabled`, `packageEnabled`, `broadcastEnabled`, `stylistPanelEnabled`, `serviceBillingEnabled`, `productBillingEnabled`, `paymentIntegrationEnabled`. Check these before rendering admin nav items or allowing API operations.

**Real-time notifications:** Socket.IO singleton in `backend/config/socket.js`. Admins join room `admin:{shopId}`, users join `user:{userId}`. Use `emitToShop(shopId, payload)` / `emitToUser(userId, payload)`.

**Slot/booking conflict prevention:**  
`appointmentModel` has a partial unique index on `{ doctorId, slotDateTime }` where `cancelled: false`. This is the single source of truth for double-booking prevention.

**Cron:** `backend/utils/appointmentCron.js` auto-completes past appointments on startup and via a scheduled job.

**Image uploads:** Multer → Cloudinary (`backend/middleware/multer.js`, `backend/config/cloudinary.js`). Uploaded images return a Cloudinary URL stored in the relevant model field.

---

### Frontend

**Single SPA** (`frontend/`) serving all roles: customer, salon admin, stylist, super admin.

**Routing** (`frontend/src/App.jsx`):
```
/                        → PlatformRoot (landing page)
/create-salon            → CreateYourSalon
/super-admin/*           → SuperAdminSection
/:shopSlug/admin/*       → ShopAdminSection
/:shopSlug/stylist/*     → StylistSection
/:shopSlug/*             → ShopCustomerSection
```
Route order matters — super-admin and admin routes are declared before `/:shopSlug/*` to prevent the slug from capturing them.

**Context providers** (wrap the entire app):
| Context | Purpose | Key state |
|---|---|---|
| `SalonAdminContext` | Salon admin session | `saAdminToken`, `shopInfo` (5-min TTL cached in localStorage), `doctors`, `appointments` |
| `ShopContext` | Customer-facing shop data | `currentShop` loaded via `/api/shop/:slug` |
| `SuperAdminContext` | Super admin session | `saToken` |
| `StylistContext` | Stylist session | `stylistToken` |
| `SlotManagementContext` | Slot settings state | Reads `aToken` from `AdminContext` (bridge) |
| `AdminContext` | Bridge: maps `SalonAdminContext` fields to the legacy `aToken`/`AdminContext` shape expected by older components |

**Token storage:** All tokens are in `localStorage` (`saAdminToken`, `saToken`, `stylisttoken`, `token`). `shopInfo` is also cached in localStorage with a `shopInfoFetchedAt` timestamp.

**Axios interceptor** in `SalonAdminContext`: rewrites any accidental `/api/admin/` calls to `/api/salon-admin/` and injects `satoken` header.

**Key page locations:**
- Customer booking: `frontend/src/pages/Appointment.jsx`
- Salon home: `frontend/src/pages/ShopHome.jsx`
- Admin dashboard: `frontend/src/pages/admin/Dashboard.jsx`
- Billing POS: `frontend/src/pages/admin/billing/Billing.jsx`
- Slot management: `frontend/src/pages/admin/SlotManagement.jsx`
- Super admin create salon: `frontend/src/pages/superadmin/CreateSalon.jsx`

**Styling:** Tailwind CSS. Primary colour token is `text-primary` / `bg-primary` (configured in `tailwind.config.js`). Follow existing card/section patterns — `rounded-2xl border border-gray-200 shadow-sm`.

**UI libraries in use:** `lucide-react` (icons), `react-toastify` (toasts), `framer-motion` (animations), `recharts` (charts), `jspdf` + `jspdf-autotable` (bill printing).

---

## Key Patterns to Follow

### Adding a new per-salon feature toggle
1. Add a Boolean field to `backend/models/shopModel.js` (default `false`).
2. Add the field to the `PUBLIC_SHOP_FIELDS` allowlist in `backend/routes/shopRoute.js` if the customer panel needs it.
3. Add it to the Super Admin create/edit forms (`CreateSalon.jsx`, `SuperAdminSalons.jsx`, `PendingSalons.jsx`).
4. Guard the admin nav item in `AdminSidebar.jsx` using `shopInfo.<toggleField>`.
5. Add a `useEffect` guard inside the feature page: `if (shopInfo && !shopInfo.<toggle>) navigate('/admin/dashboard')`.

### Adding a new salon-admin API endpoint
1. Add the controller function (filter all queries by `req.salonAdmin.shopId`).
2. Export it from the controller and import it in `salonAdminRoute.js`.
3. Mount with `authSalonAdmin` middleware: `salonAdminRouter.<method>('/path', authSalonAdmin, handler)`.

### Bill number generation
`billModel` auto-generates `BILL-{SHOPID}-{NNNN}` via a `pre('validate')` hook. Do not set `billNumber` manually.

### Slot availability
Slots are generated server-side from `SlotSettings` + `BlockedDate` + `RecurringHoliday` + `SpecialWorkingDay` documents (all scoped by `shopId`). Booked slots are excluded by querying `appointmentModel` for the date/doctor. The unique index on `appointmentModel` is the final guard against races.
