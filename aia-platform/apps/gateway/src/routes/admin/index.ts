import { Hono } from 'hono';
import { requireRole } from '../../middleware/auth.js';
import { adminTenantsRouter } from './tenants.js';
import { adminUsersRouter } from './users.js';
import { adminUsageRouter } from './usage.js';
import { adminOnboardingRouter } from './onboarding.js';
import { adminMarketplaceRouter } from './marketplace.js';
import { adminActionsRouter } from './actions.js';
import { adminApiKeysRouter } from './api-keys.js';
import { adminBillingRouter } from './billing.js';
import { adminPlansRouter } from './plans.js';
import { adminSettingsRouter } from './settings.js';

/**
 * Admin routes for the consultant dashboard.
 * All routes require platform_admin role (the consultant).
 * Mounted at /api/admin.
 *
 * Route map:
 *   /api/admin/tenants                         — tenant CRUD
 *   /api/admin/tenants/:tenantId/users         — user management per tenant
 *   /api/admin/tenants/:tenantId/keys          — API key management per tenant
 *   /api/admin/usage                           — cross-tenant usage/billing
 *   /api/admin/billing                         — billing reports and CSV export
 *   /api/admin/onboarding                      — onboarding wizard
 *   /api/admin/marketplace                     — agent template marketplace
 *   /api/admin/plans                           — plan CRUD (allowed models, limits, price)
 */
const adminRouter = new Hono();

// Apply platform_admin role guard to all admin routes
adminRouter.use('*', requireRole('platform_admin'));

// Mount sub-routers
adminRouter.route('/tenants', adminTenantsRouter);
adminRouter.route('/tenants/:tenantId/users', adminUsersRouter);
adminRouter.route('/tenants/:tenantId/keys', adminApiKeysRouter);
adminRouter.route('/usage', adminUsageRouter);
adminRouter.route('/billing', adminBillingRouter);
adminRouter.route('/onboarding', adminOnboardingRouter);
adminRouter.route('/marketplace', adminMarketplaceRouter);
adminRouter.route('/actions', adminActionsRouter);
adminRouter.route('/plans', adminPlansRouter);
adminRouter.route('/settings', adminSettingsRouter);

export { adminRouter };
