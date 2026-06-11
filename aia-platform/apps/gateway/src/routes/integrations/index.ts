/**
 * Integration routes index.
 *
 * Mounts all integration sub-routers.
 * Mounted at: /api/integrations
 */

import { Hono } from 'hono';
import { emailRouter } from './email.js';
import { browserRouter } from './browser.js';
import { localAgentRouter } from './local-agent.js';

const integrationsRouter = new Hono();

// Email integration: /api/integrations/email/*
integrationsRouter.route('/email', emailRouter);

// Browser automation: /api/integrations/browser/*
integrationsRouter.route('/browser', browserRouter);

// Local agent management: /api/integrations/local-agent/*
integrationsRouter.route('/local-agent', localAgentRouter);

export { integrationsRouter };
