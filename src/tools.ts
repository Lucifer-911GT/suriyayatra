// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * `suriyayatra/tools`: the library as tools an AI model (or any program) can call with JSON.
 *
 * getTools() lists each tool with a JSON Schema (2020-12) for its input and its output;
 * executeTool(name, args) checks the arguments against the schema, runs the calculation and
 * always returns an envelope — it never throws:
 *
 *   { ok: true,  tool, version, data }
 *   { ok: false, tool, version, error: { code, message, path? } }
 *
 * Error codes: `unknown_tool`, `invalid_input` (schema; `path` says where), `out_of_range` (a
 * value the calculation refuses, e.g. a date outside the lunar calendar), `internal`. Messages
 * never repeat the input. Spans are capped by TOOL_LIMITS and cannot be raised by the caller.
 */
import { TOOLS, TOOL_LIMITS } from './tools/definitions.js';
import { validate, type JsonSchema } from './tools/schema.js';

export { TOOL_LIMITS };
export type { JsonSchema };

/** Version of the envelope and schemas; raised on any incompatible change. */
export const TOOL_PROTOCOL_VERSION = 1;
const DIALECT = 'https://json-schema.org/draft/2020-12/schema';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
}

export type ToolErrorCode = 'unknown_tool' | 'invalid_input' | 'out_of_range' | 'internal';

export type ToolResult =
  | { ok: true; tool: string; version: number; data: unknown }
  | { ok: false; tool: string; version: number; error: { code: ToolErrorCode; message: string; path?: string } };

function deepFreeze<T>(v: T): T {
  if (typeof v === 'object' && v !== null && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const child of Object.values(v)) deepFreeze(child);
  }
  return v;
}

const DEFINITIONS: readonly ToolDefinition[] = deepFreeze(TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  inputSchema: { $schema: DIALECT, ...t.inputSchema },
  outputSchema: { $schema: DIALECT, ...t.outputSchema },
})));
const BY_NAME: ReadonlyMap<string, (typeof TOOLS)[number]> = new Map(TOOLS.map((t) => [t.name, t]));

/** Every tool with its description and JSON Schemas (frozen). */
export function getTools(): readonly ToolDefinition[] {
  return DEFINITIONS;
}

/** One tool's definition, or undefined. */
export function getTool(name: string): ToolDefinition | undefined {
  return DEFINITIONS.find((t) => t.name === name);
}

/**
 * A plain-data copy of the arguments, read exactly once. Getters, proxies and other live objects
 * are resolved here (or refused), so what is validated is exactly what the tool runs on.
 */
function snapshot(args: unknown): { ok: true; value: unknown } | { ok: false } {
  try {
    const text = JSON.stringify(args ?? {});
    return text === undefined ? { ok: false } : { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false }; // a throwing getter, a cycle, a BigInt …
  }
}

/** Runs a tool on JSON arguments. Never throws; see the module comment for the envelope. */
export function executeTool(name: unknown, args: unknown): ToolResult {
  const tool = typeof name === 'string' ? BY_NAME.get(name) : undefined;
  const label = tool ? tool.name : 'unknown';
  const fail = (code: ToolErrorCode, message: string, path?: string): ToolResult =>
    ({ ok: false, tool: label, version: TOOL_PROTOCOL_VERSION, error: { code, message, ...(path ? { path } : {}) } });
  if (!tool) return fail('unknown_tool', 'No tool by that name; see getTools()');
  const input = snapshot(args);
  if (!input.ok) return fail('invalid_input', 'The arguments must be plain JSON data');
  try {
    const issue = validate(tool.inputSchema, input.value);
    if (issue) return fail('invalid_input', `${issue.path} ${issue.message}`, issue.path);
    // Round-trip through JSON so the result is plain data, whatever the library returns.
    const data: unknown = JSON.parse(JSON.stringify(tool.run(input.value as Record<string, unknown>)));
    return { ok: true, tool: label, version: TOOL_PROTOCOL_VERSION, data };
  } catch (e) {
    if (e instanceof RangeError) return fail('out_of_range', e.message);
    return fail('internal', 'The calculation failed unexpectedly');
  }
}
