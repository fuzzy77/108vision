import type { ExtensionShellContext, SkillExecutionResult } from '../types.js';
import { executeSkill } from './executor.js';
import {
  matchSkillImplicit,
  resolveSkill,
  resolveSkillByExplicitTrigger,
} from './registry.js';

export interface SkillRouteResult {
  handled: boolean;
  output?: string;
  tokens?: number;
  model?: string;
  skillName?: string;
}

function toRouteResult(result: SkillExecutionResult): SkillRouteResult {
  return {
    handled: true,
    output: result.output,
    tokens: result.tokens,
    model: result.model,
    skillName: result.skillName,
  };
}

/** Execute skill by explicit slash trigger name (e.g. write-email) */
export async function tryExecuteSkillExplicit(
  triggerName: string,
  args: string[],
  userMessage: string,
  shellCtx: ExtensionShellContext,
): Promise<SkillRouteResult> {
  const skill = resolveSkillByExplicitTrigger(triggerName);
  if (!skill) return { handled: false };

  try {
    const message = userMessage || args.join(' ') || 'Scrivi una email';
    const result = await executeSkill(skill, message, shellCtx, {
      args,
      trigger: 'explicit',
    });
    return toRouteResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { handled: true, output: `  \x1b[31m[ERR]\x1b[0m ${message}\n` };
  }
}

/** Execute skill by registry name via /skill run */
export async function tryExecuteSkillByName(
  name: string,
  args: string[],
  userMessage: string,
  shellCtx: ExtensionShellContext,
): Promise<SkillRouteResult> {
  const skill = resolveSkill(name);
  if (!skill) return { handled: false };

  try {
    const message = userMessage || args.join(' ') || skill.manifest.description;
    const result = await executeSkill(skill, message, shellCtx, {
      args,
      trigger: 'explicit',
    });
    return toRouteResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { handled: true, output: `  \x1b[31m[ERR]\x1b[0m ${message}\n` };
  }
}

/** Match implicit patterns in natural language input */
export async function tryExecuteSkillImplicit(
  userInput: string,
  shellCtx: ExtensionShellContext,
): Promise<SkillRouteResult> {
  const match = matchSkillImplicit(userInput);
  if (!match) return { handled: false };

  try {
    const result = await executeSkill(match.skill, userInput, shellCtx, {
      trigger: 'implicit',
    });
    return toRouteResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { handled: true, output: `  \x1b[31m[ERR]\x1b[0m ${message}\n` };
  }
}
