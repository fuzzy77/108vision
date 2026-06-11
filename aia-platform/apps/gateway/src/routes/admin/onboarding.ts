import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import { onboardingService } from '../../services/onboarding.service.js';

const adminOnboardingRouter = new Hono();

const startOnboardingSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  sector: z.string().max(100).optional(),
  size: z.enum(['micro', 'small', 'medium', 'large']).optional(),
  config: z.record(z.unknown()).optional(),
});

const installAgentsSchema = z.object({
  templateIds: z.array(z.string().uuid()).min(1).max(20),
});

const crawlSchema = z.object({
  url: z.string().url().max(2048),
});

const inviteSchema = z.object({
  invitations: z.array(z.object({
    email: z.string().email().max(255),
    role: z.enum(['tenant_admin', 'tenant_operator', 'client_user']).default('client_user'),
  })).min(1).max(50),
});

/**
 * POST /api/admin/onboarding/start — Begin onboarding (create tenant + initial config).
 */
adminOnboardingRouter.post('/start', async (c) => {
  const body = await c.req.json();
  const input = startOnboardingSchema.parse(body);

  const result = await onboardingService.createTenant({
    name: input.name,
    slug: input.slug,
    sector: input.sector,
    size: input.size,
    config: input.config,
  });

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    message: 'Onboarding started',
    tenantId: result.data.tenantId,
    slug: result.data.slug,
    nextSteps: [
      'Install agent templates',
      'Add knowledge base content',
      'Invite users',
      'Activate tenant',
    ],
  }, 201);
});

/**
 * POST /api/admin/onboarding/:tenantId/agents — Install agent templates for tenant.
 */
adminOnboardingRouter.post('/:tenantId/agents', async (c) => {
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const body = await c.req.json();
  const input = installAgentsSchema.parse(body);

  const result = await onboardingService.installAgentTemplates(tenantId, input.templateIds);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    message: `Installed ${result.data.installedCount} agent(s)`,
    installedCount: result.data.installedCount,
  });
});

/**
 * POST /api/admin/onboarding/:tenantId/kb/crawl — Queue a URL crawl for initial KB population.
 */
adminOnboardingRouter.post('/:tenantId/kb/crawl', async (c) => {
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const body = await c.req.json();
  const input = crawlSchema.parse(body);

  const result = await onboardingService.crawlUrl(tenantId, input.url);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    message: 'URL crawl queued',
    jobId: result.data.jobId,
    url: result.data.url,
  }, 202);
});

/**
 * POST /api/admin/onboarding/:tenantId/invite — Send invitation emails to client users.
 */
adminOnboardingRouter.post('/:tenantId/invite', async (c) => {
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const input = inviteSchema.parse(body);

  const result = await onboardingService.inviteUsers(tenantId, input.invitations, userId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    message: `${result.data.invitedCount} invitation(s) sent`,
    invitedCount: result.data.invitedCount,
  });
});

/**
 * POST /api/admin/onboarding/:tenantId/activate — Finalize and activate tenant.
 */
adminOnboardingRouter.post('/:tenantId/activate', async (c) => {
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const result = await onboardingService.activateTenant(tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    message: 'Tenant activated successfully',
    tenantId: result.data.tenantId,
    status: result.data.status,
  });
});

export { adminOnboardingRouter };
