# Product Detail v2.2 Progress

## Scope

- Product detail page implementation
- Error-aware handling for missing products and cart failures
- Fallback support for current demo products on the home page
- Self-check summary for later handoff

## Implemented

### 1. Product detail page

File: `app/products/[id]/page.tsx`

- Replaced the skeleton-only page with a full detail screen
- Added:
  - breadcrumb
  - hero product image
  - thumbnail switching
  - category / price / stock display
  - quantity control
  - add-to-cart action
  - related products section

### 2. API + fallback strategy

- If the route id is one of the current demo ids (`1` to `8`), the page uses local demo data
- Otherwise it requests `GET /api/products/:id`
- This prevents the current home page cards from breaking while the homepage still uses demo product data

### 3. Cart handling

- Real API products:
  - add-to-cart calls `POST /api/cart`
  - unauthenticated users are redirected to login with `next=/products/:id`
- Demo products:
  - add-to-cart is intentionally blocked with a user-facing message

### 4. Shared demo product source

File: `lib/demo-products.ts`

- Moved demo product data into a shared module
- Updated `components/shopping-mall-client.tsx` to consume this shared source
- Detail page now reuses the same demo dataset

## Error handling covered

- Product not found from API
- Invalid / missing product id
- Empty image set
- Out-of-stock state
- Add-to-cart API failure
- Unauthenticated add-to-cart attempt

## Validation performed

- Manual static review of:
  - `app/products/[id]/page.tsx`
  - `lib/demo-products.ts`
  - `components/shopping-mall-client.tsx`
- Repository-wide TypeScript check executed with:
  - `npx tsc -p . --noEmit --pretty false`

## Validation result

- New product detail implementation did not introduce a new reported TypeScript error in the check output
- Existing unrelated repo errors still remain:
  - `components/shopping-mall-client.tsx` spotlight prop typing
  - `components/ui/pricing.tsx` canvas-confetti declaration
  - `lib/api.ts` axios / implicit any issues

## Next recommended step

- Connect the homepage product grid to DB products instead of demo products so product detail, admin product CRUD, and storefront listing all share the same source of truth

## Order Complete Step 3

### Scope

- Real checkout page implementation
- Real order success page implementation
- Error-aware order creation / order fetch handling

### Implemented

#### 1. Checkout page

File: `app/checkout/page.tsx`

- Replaced the skeleton checkout page with:
  - cart fetch from `GET /api/cart`
  - shipping form
  - payment method selection
  - live order summary
  - order creation with `POST /api/orders`
- Redirects unauthenticated users to login with `next=/checkout`
- Redirects successful order creation to:
  - `/order/success?orderId=...`

#### 2. Order success page

File: `app/order/success/page.tsx`

- Replaced the generic success page with:
  - order lookup from `GET /api/orders/:id`
  - order id display
  - ordered items summary
  - shipping info display
  - payment info display
  - status label display
  - links to `내 주문 보기` and home

### Error handling covered

- unauthenticated checkout access
- empty cart during checkout
- missing required shipping fields
- order creation API failure
- missing `orderId` query on success page
- order lookup failure on success page

### Validation performed

- Static review of:
  - `app/checkout/page.tsx`
  - `app/order/success/page.tsx`
- Repository-wide TypeScript check executed again:
  - `npx tsc -p . --noEmit --pretty false`

### Validation result

- No new TypeScript error from the checkout / order success implementation was surfaced in the current check output
- Existing unrelated repo errors still remain:
  - `components/shopping-mall-client.tsx` spotlight prop typing
  - `components/ui/pricing.tsx` canvas-confetti declaration
  - `lib/api.ts` axios / implicit any issues

## Navbar Product Link Review

### Scope

- Align navbar links with real storefront destinations
- Make navbar entries lead to actual product views instead of dead anchors
- Preserve compatibility with the previous `#new-arrivals` link shape

### Implemented

#### 1. Navbar product entry points

File: `components/layout/Navbar.tsx`

- Replaced generic section anchors with concrete storefront links:
  - `New Arrivals`
  - `Outerwear`
  - `Dresses`
  - `Accessories`
- Each navbar item now routes to home with query + hash:
  - `/?category=...#collections`

#### 2. Home product filter sync

File: `components/shopping-mall-client.tsx`

- Added `New Arrivals` as a first-class product filter
- Homepage now reads `category` from the URL search params
- Added compatibility for legacy `#new-arrivals` hash navigation
- Product grid now immediately reflects navbar-driven entry state

#### 3. Hero secondary CTA alignment

File: `lib/site-content.ts`

- Updated the default hero secondary CTA target from a dead `#new-arrivals` anchor to:
  - `/?category=New%20Arrivals#collections`

### Validation performed

- Static review of:
  - `components/layout/Navbar.tsx`
  - `components/shopping-mall-client.tsx`
  - `lib/site-content.ts`

### Expected result

- Navbar clicks now land on the product grid and apply the intended product grouping
- `New Arrivals` no longer points to a non-existent standalone section

## Storefront DB Sync + JWT Middleware Split

### Scope

- Replace homepage demo-first product rendering with DB-backed storefront rendering
- Keep graceful fallback when the products API is unavailable or empty
- Separate JWT token parsing / verification into a dedicated middleware file

### Implemented

#### 1. Homepage product source migration

File: `components/shopping-mall-client.tsx`

- Added storefront product fetch from:
  - `GET /api/products?limit=24`
- Homepage now prefers DB products over demo products
- If the API fails or returns nothing usable, the existing demo product fallback remains
- Added normalized storefront product mapping so existing `ProductCard` can be reused without UI duplication

#### 2. Category / new-arrival behavior preservation

File: `components/shopping-mall-client.tsx`

- Dynamic categories are now derived from the active storefront dataset
- `New Arrivals` is preserved as a synthetic filter
- For real DB products, the newest 4 items are marked as `New`
- Existing navbar query-driven category navigation continues to work

#### 3. JWT middleware separation

Files:
- `server/middleware/jwt.js`
- `server/middleware/auth.js`

- Extracted bearer-token parsing and JWT verification into a dedicated `jwt.js`
- Kept `auth.js` focused on:
  - loading the authenticated user
  - attaching `req.user`
  - admin-role enforcement via `requireAdmin`
- Existing route imports remain stable because `auth.js` still exports `auth` / `requireAdmin`

### Validation performed

- Client TypeScript check:
  - `npx tsc -p . --noEmit --pretty false`
- Server syntax checks:
  - `node --check server/middleware/auth.js`
  - `node --check server/middleware/jwt.js`
  - `node --check server/controllers/productController.js`

### Validation result

- No new client TypeScript error attributable to this DB-sync / JWT-split change
- Existing unrelated client errors still remain:
  - `components/shopping-mall-client.tsx` spotlight prop typing
  - `components/ui/pricing.tsx` canvas-confetti declaration
  - `lib/api.ts` axios / implicit any issues
- Server-side syntax checks for the touched authentication / product files passed

## Category Management In Admin Content

### Scope

- Manage storefront categories from the admin content screen
- Treat category deletion as hide-only behavior
- Ensure products in hidden categories remain in admin product management

### Implemented

#### 1. Category domain + API

Files:
- `server/models/Category.js`
- `server/controllers/categoryController.js`
- `server/routes/categoryRoutes.js`
- `server/app.js`

- Added dedicated category persistence with:
  - `name`
  - `normalizedName`
  - `isVisible`
- Added category APIs:
  - `GET /api/categories`
  - `POST /api/categories`
  - `DELETE /api/categories/:id` -> hide only
  - `PATCH /api/categories/:id/show` -> restore visibility

#### 2. Product visibility behavior

Files:
- `server/middleware/auth.js`
- `server/routes/productRoutes.js`
- `server/controllers/productController.js`

- Added `optionalAuth` to public product routes
- Public storefront product queries now exclude products whose category is hidden
- Admin product queries still include those products
- Hidden-category products are therefore:
  - preserved in DB
  - preserved in admin management
  - removed only from storefront exposure

#### 3. Admin content category section

File: `app/admin/content/page.tsx`

- Added category management section to the content admin screen
- Supports:
  - category add
  - category hide (`삭제`)
  - category restore (`다시 표시`)
- Shows product counts per category
- Delete confirmation explicitly states that products are not deleted, only hidden from storefront

#### 4. Admin product page visibility

File: `app/admin/products/page.tsx`

- Product management now loads category metadata together with product data
- Category dropdown options come from the category API
- Existing products continue to appear in the admin list even when their category is hidden
- Hidden-category products are visually marked as `숨김 카테고리`

### Validation performed

- Client TypeScript check:
  - `npx tsc -p . --noEmit --pretty false`
- Server syntax checks:
  - `node --check server/controllers/categoryController.js`
  - `node --check server/routes/categoryRoutes.js`
  - `node --check server/controllers/productController.js`

### Validation result

- No new client TypeScript error attributable to this category-management change
- Existing unrelated client errors still remain:
  - `components/shopping-mall-client.tsx` spotlight prop typing
  - `components/ui/pricing.tsx` canvas-confetti declaration
  - `lib/api.ts` axios / implicit any issues
- Server-side syntax checks for the touched category / product files passed

## Demo Products Seeded Into Product Schema

### Scope

- Move demo merchandise into the real `Product` schema so admin can manage it as normal catalog data
- Keep a repeatable seed path instead of one-off manual DB edits

### Implemented

Files:
- `server/seed/demoProducts.js`
- `server/seed/seedDemoProducts.js`
- `server/package.json`

- Added a dedicated demo product seed dataset on the server side
- Added `npm run seed:demo-products`
- Seed logic now:
  - creates missing categories
  - upserts demo products by product name
  - reactivates them if needed

### Execution result

- Executed:
  - `npm run seed:demo-products`
- Result:
  - `MongoDB connected`
  - `Demo products seeded. Created: 0, Updated: 8`

### Validation performed

- Server syntax check:
  - `node --check server/seed/seedDemoProducts.js`
- Client TypeScript check:
  - `npx tsc -p . --noEmit --pretty false`

### Validation result

- Demo products are now present in the real product schema and should appear in admin product management as regular products
- No new client TypeScript error attributable to this seed change
- Existing unrelated client errors still remain:
  - `components/shopping-mall-client.tsx` spotlight prop typing
  - `components/ui/pricing.tsx` canvas-confetti declaration
  - `lib/api.ts` axios / implicit any issues

## Multi-Category Product Registration

### Scope

- Allow a product to belong to multiple categories
- Make category selection required in admin product registration
- Keep storefront filtering compatible with the new schema

### Implemented

#### 1. Product schema expansion

Files:
- `server/models/Product.js`
- `server/controllers/productController.js`

- Added `categories: string[]` to the product schema
- Kept `category` as the primary/legacy category for compatibility
- Added schema sync logic so:
  - first selected category becomes `category`
  - full selected set is stored in `categories`
- Product create/update now requires at least one category

#### 2. Admin product form multi-select

File: `app/admin/products/page.tsx`

- Replaced single category dropdown with toggle-style multi-category chips
- Clicking a category adds it
- Clicking a selected category again removes it
- At least one category is now required before save
- Product list now shows multiple assigned categories

#### 3. Storefront compatibility

Files:
- `client/lib/types.ts`
- `components/shopping-mall-client.tsx`
- `app/products/[id]/page.tsx`

- Client product types now support `categories`
- Homepage filtering checks category membership against the array
- Product detail uses the first category as primary display and preserves the full list for related logic / messaging

#### 4. Seed data re-sync

Files:
- `server/seed/demoProducts.js`
- `server/seed/seedDemoProducts.js`

- Demo seed data now includes `categories`
- Re-seeded the DB so current demo products are aligned with the new schema

### Execution result

- Executed:
  - `npm run seed:demo-products`
- Result:
  - `MongoDB connected`
  - `Demo products seeded. Created: 0, Updated: 8`

### Validation performed

- Server syntax checks:
  - `node --check server/controllers/productController.js`
  - `node --check server/models/Product.js`
- Client TypeScript check:
  - `npx tsc -p . --noEmit --pretty false`

### Validation result

- Multi-category product data is now persisted in the schema
- No new client TypeScript error attributable to this multi-category change
- Existing unrelated client errors still remain:
  - `components/shopping-mall-client.tsx` spotlight prop typing
  - `components/ui/pricing.tsx` canvas-confetti declaration
  - `lib/api.ts` axios / implicit any issues

## Category Badges + Ordering + KRW Formatting

### Scope

- Show supporting category badges on product cards and product detail
- Allow admin users to reorder categories
- Change product-facing price display to KRW

### Implemented

#### 1. KRW formatting utility

File:
- `client/lib/format.ts`

- Added shared `formatKRW()` helper using `ko-KR` / `KRW`

#### 2. Product card / detail category badges

Files:
- `components/products/ProductCard.tsx`
- `app/products/[id]/page.tsx`

- Product cards now show secondary categories as badge chips
- Product detail now shows additional categories above the product name

#### 3. Admin category ordering

Files:
- `server/models/Category.js`
- `server/controllers/categoryController.js`
- `server/routes/categoryRoutes.js`
- `app/admin/content/page.tsx`

- Added `sortOrder` to category model
- Added admin reorder endpoint:
  - `PATCH /api/categories/reorder`
- Added `위로` / `아래로` controls in admin content category management
- Navbar category order now follows server-side category order

#### 4. KRW price display rollout

Files:
- `components/products/ProductCard.tsx`
- `app/products/[id]/page.tsx`
- `app/admin/products/page.tsx`
- `app/checkout/page.tsx`
- `app/order/success/page.tsx`

- Product prices are now displayed in Korean won formatting across storefront/admin checkout-related views

### Validation performed

- Server syntax checks:
  - `node --check server/controllers/categoryController.js`
  - `node --check server/routes/categoryRoutes.js`
  - `node --check server/models/Category.js`
- Client TypeScript check:
  - `npx tsc -p . --noEmit --pretty false`

### Validation result

- No new client TypeScript error attributable to these badge / ordering / KRW changes
- Existing unrelated client errors still remain:
  - `components/shopping-mall-client.tsx` spotlight prop typing
  - `components/ui/pricing.tsx` canvas-confetti declaration
  - `lib/api.ts` axios / implicit any issues

## Admin / Storefront Folder Rebuild

### Scope

- Clearly separate admin pages and storefront pages
- Separate admin-specific and storefront-specific layout/components without changing URLs

### Implemented

#### 1. Route group split

Files / folders:
- `app/(storefront)/...`
- `app/(admin)/admin/...`

- Storefront pages moved under `app/(storefront)`
- Admin pages moved under `app/(admin)/admin`
- URL structure remains unchanged because Next route groups are pathless

#### 2. Layout split

Files:
- `app/layout.tsx`
- `app/(storefront)/layout.tsx`
- `app/(admin)/admin/layout.tsx`

- Root layout now holds only shared providers / global shell concerns
- Storefront layout now owns:
  - `Navbar`
  - `Footer`
- Admin layout now owns:
  - dedicated `AdminHeader`

#### 3. Component separation

Files / folders:
- `components/storefront/...`
- `components/admin/layout/AdminHeader.tsx`

- Storefront-only components moved under `components/storefront`
  - home hero
  - storefront layout
  - product card
  - shopping mall client
- Added dedicated admin header component

### Validation performed

- Cleared stale generated route artifacts:
  - removed `.next`
- Client TypeScript check:
  - `npx tsc -p . --noEmit --pretty false`

### Validation result

- Route-group restructuring is reflected in the new folder organization
- No new restructure-specific import / route error remains after clearing stale `.next` output
- Existing unrelated client errors still remain:
  - `components/storefront/shopping-mall-client.tsx` spotlight prop typing
  - `components/ui/pricing.tsx` canvas-confetti declaration
  - `lib/api.ts` axios / implicit any issues

## Home Rebuild Baseline Reset

### Scope

- Re-align the storefront home page with the current admin/CMS/data model
- Keep the observer robot as an independent decorative layer instead of mixing it into section layout
- Replace fragile API/type issues so the client baseline compiles cleanly again

### Implemented

#### 1. Home data structure realignment

Files:
- `components/shopping-mall-client.tsx`
- `components/home/HeroSection.tsx`
- `lib/site-content.ts`
- `lib/demo-products.ts`

- Rebuilt the home page to use:
  - CMS content from `GET /api/site-content/home`
  - DB products from `GET /api/products?limit=24`
  - demo products only as fallback
- Reintroduced URL-driven category selection while keeping the current admin/CMS structure intact
- Restored hero rendering as prop-driven content instead of hardcoded copy

#### 2. Observer robot isolation

Files:
- `components/observer-robot.tsx`
- `components/ui/spline-scene.tsx`

- Kept the observer robot as a fixed independent layer
- Kept robot logic separate from product section layout so storefront structure and robot behavior do not fight each other
- Locked Spline rendering to the runtime-based `SplineScene` implementation

#### 3. Type baseline recovery

Files:
- `components/ui/spotlight.tsx`
- `lib/api.ts`
- `types/canvas-confetti.d.ts`

- Restored `Spotlight` support for the existing `fill` prop used by the storefront
- Replaced the broken axios-based API helper with a typed `fetch` wrapper
- Added a local type declaration for `canvas-confetti`

### Validation performed

- Repository-wide TypeScript check:
  - `npx tsc -p . --noEmit --pretty false`

### Validation result

- Client TypeScript check passes with no reported errors
- This state should be treated as the new storefront baseline before any further robot behavior work

## Navbar / Robot Stability Fix

### Scope

- Restore stable top-right actions in Navbar (`Search / Login / Cart`)
- Ensure login action is always visible and clickable in unauthenticated state
- Prevent observer robot from intercepting Navbar/home interactions

### Implemented

Files:
- `components/layout/Navbar.tsx`
- `components/observer-robot.tsx`

- Navbar is now structured with explicit left/center/right regions:
  - left: menu/logo
  - center: category nav (scrollable on overflow)
  - right: search/login/cart actions with non-shrinking behavior
- Unauthenticated state always renders a visible `Login` control with text label
- Observer robot container remains decorative and non-interactive for pointer input

### Validation performed

- TypeScript check:
  - `npx tsc -p . --noEmit --pretty false`

### Validation result

- TypeScript passes
- Production build command (`npm run build`) could not be fully validated in this environment due to `spawn EPERM` process permission limits
