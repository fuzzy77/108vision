import { Hono } from 'hono';
import { requireRole } from '../../middleware/auth.js';
import { adminTenantsRouter } from './tenants.js';
import { adminUsersRouter } from './users.js';
import { adminUsageRouter } from './usage.js';
import { adminOnboardingRouter } from './onboarding.js';
import { adminMarketplaceRouter } from './marketplace.js';

/**
 * Admin routes for the consultant dashboard.
 * All routes require platform_admin role (the consultant).
 * Mounted at /api/admin.
 *
 * Route map:
 *   /api/admin/tenants                         — tenant CRUD
 *   /api/admin/tenants/:tenantId/users         — user management per tenant
 *   /api/admin/usage                           — cross-tenant usage/billing
 *   /api/admin/onboarding                      — onboarding wizard
 *   /api/admin/marketplace                     — agent template marketplace
 */
const adminRouter = new Hono();

// Apply platform_admin role guard to all admin routes
adminRouter.use('*', requireRole('platform_admin'));

// Mount sub-routers
adminRouter.route('/tenants', adminTenantsRouter);
adminRouter.route('/tenants/:tenantId/users', adminUsersRouter);
adminRouter.route('/usage', adminUsageRouter);
adminRouter.route('/onboarding', adminOnboardingRouter);
adminRouter.route('/marketplace', adminMarketplaceRouter);

export { adminRouter };
