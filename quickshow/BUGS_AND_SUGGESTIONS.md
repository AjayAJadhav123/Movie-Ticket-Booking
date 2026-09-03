# QuickShow Project Audit: Bugs, Suggestions, and Responsiveness

## 1. Bugs Found & Fixed
- **[CRITICAL] Admin Logout State Desynchronization**: Admin logout cleared localStorage but left React Context dirty, causing infinite redirect loops back to the dashboard with 403 errors. *(Fixed)*
- **[CRITICAL] Cashfree API Version Mismatch**: The SDK v6 defaulted to API version 2026-01-01, which Sandbox rejected. Explicitly forced v2023-08-01. *(Fixed)*
- **[CRITICAL] Booking 403 Error**: `getBookingById` incorrectly compared MongoDB ObjectIds to strings using strict equality, preventing users from viewing their own tickets. *(Fixed)*

## 2. UI/UX Issues
- **[MEDIUM] Inconsistent Dark Mode**: Some admin pages use `#0f172a` (Slate-900) while public pages use `#0a0a0a` (Neutral-950). Needs a unified token system.
- **[LOW] Missing Loading Skeletons**: Fetching movies shows a generic spinner instead of skeleton loaders, creating visual layout shifts.
- **[MEDIUM] Native Select Menus**: Admin dashboard uses native HTML `<select>` elements instead of styled dropdowns (e.g., `DarkSelect`), breaking the premium dark aesthetic.

## 3. Responsive Issues (To Be Fixed in this Implementation Plan)
- **[HIGH] Admin Layout Mobile Sidebar**: The sidebar is responsive but on small screens the overlay transition might flash.
- **[MEDIUM] Seat Grid Widths**: Very large theaters (20+ columns) might shrink seats too small before triggering horizontal scroll.
- **[MEDIUM] Admin Data Tables**: Most tables have `overflow-x-auto`, but `AdminDashboard` Recent Bookings does not, causing horizontal overflow on mobile.
- **[LOW] Fixed Width Modals**: Login/Register modals and some admin cards use strict `max-w-[420px]` or similar classes which look squeezed on narrow mobile devices (320px).
- **[LOW] Form Grids**: Cinema and Screen creation forms don't consistently collapse from `grid-cols-2` to `grid-cols-1` on mobile.

## 4. Functional Issues
- **[MEDIUM] Optimistic UI on Favorites**: The favorite toggle relies on a `setTimeout` refetch which can race against network latency if toggled too fast.

## 5. Security Concerns
- **[HIGH] Token Storage**: Admin and User tokens are stored in raw `localStorage`. Should ideally use `HttpOnly` cookies for XSS protection, though token interceptors are configured correctly for now.
- **[MEDIUM] Stripe Secret Exposure Risk**: If `STRIPE_SECRET_KEY` is accidentally leaked via frontend bundle (checked: currently safe on backend only).

## 6. Performance Issues
- **[MEDIUM] TMDB API Throttling**: The dashboard hits multiple TMDB endpoints sequentially on mount. Could benefit from `Promise.all` or caching layer.
- **[LOW] Large Bundle Size**: Missing code-splitting (`React.lazy`) for heavy admin routes, meaning public users download admin components unnecessarily.

## 7. Admin-Panel Issues
- **[MEDIUM] Delete Warnings**: Deleting shows/movies doesn't always have a strict double-confirmation modal.
- **[LOW] Dashboard Refresh**: The refresh data button triggers a full visual reload instead of a silent background sync.

## 8. Payment/Booking Edge Cases
- **[HIGH] Abandoned Checkouts**: If a user creates a Cashfree session but closes the tab, the locked seats stay locked indefinitely until the socket times out. Needs a robust Cron job to release seats after 10 minutes.
- **[MEDIUM] Duplicate Payment Verification**: `PaymentCallback` uses a strict 10-retry polling mechanism. If the user navigates away mid-poll, the UI fails silently.

## 9. Suggestions for Improvement
- **Migrate to Next.js**: For better SEO, SSR, and API route handling.
- **Implement WebSockets strictly**: Switch from standard API polling to pure Socket.io events for real-time seat locks and booking confirmations.
- **PWA Support**: Add a `manifest.json` and service worker to allow users to install QuickShow on their phones.
- **Add Email Receipts**: Integrate SendGrid/Resend to automatically email the ticket PDF to the user upon successful payment.
