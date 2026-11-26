// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * The command line, as a pure function: bin/suriyayatra.mjs does the reading and printing.
 *
 *   suriyayatra tools                          list the tools
 *   suriyayatra schema <tool>                  a tool's input and output JSON Schemas
 *   suriyayatra call <tool> [--input <file>]   run a tool; the arguments are JSON from the
 *                                              file, or from stdin without --input
 *
 * Output is JSON on stdout. Exit codes: 0 done, 1 the tool refused the input (the envelope on
 * stdout says why), 2 a usage error (message on stderr).
 */
import { executeTool, getTool, getTools } from './tools.js';

export interface CliIo {
  /** The text of `path`, or of stdin when `path` is undefined. May throw or reject. */
  readInput(path: string | undefined): string | Promise<string>;
}

export interface CliResult {
  code: 0 | 1 | 2;
  stdout: string;
  stderr: string;
}

export const CLI_USAGE = `Usage:
  suriyayatra tools
  suriyayatra schema <tool>
  suriyayatra call <tool> [--input <file.json>]   (arguments from stdin without --input)
`;

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
const done = (v: unknown): CliResult => ({ code: 0, stdout: json(v), stderr: '' });
const usage = (message: string): CliResult => ({ code: 2, stdout: '', stderr: `${message}\n\n${CLI_USAGE}` });

export async function runCli(argv: readonly string[], io: CliIo): Promise<CliResult> {
  const [command, ...rest] = argv;
  if (command === undefined || command === 'help' || command === '--help' || command === '-h') {
    return { code: command === undefined ? 2 : 0, stdout: command === undefined ? '' : CLI_USAGE, stderr: command === undefined ? CLI_USAGE : '' };
  }
  if (command === 'tools') {
    if (rest.length) return usage('`tools` takes no arguments');
    return done(getTools().map((t) => ({ name: t.name, description: t.description })));
  }
  if (command === 'schema') {
    const tool = rest.length === 1 ? getTool(rest[0]) : undefined;
    if (!tool) return usage('`schema` needs one tool name; see `suriyayatra tools`');
    return done({ name: tool.name, inputSchema: tool.inputSchema, outputSchema: tool.outputSchema });
  }
  if (command === 'call') return call(rest, io);
  return usage('Unknown command');
}

async function call(rest: readonly string[], io: CliIo): Promise<CliResult> {
  const [name, ...opts] = rest;
  if (!name) return usage('`call` needs a tool name; see `suriyayatra tools`');
  let path: string | undefined;
  if (opts.length === 2 && opts[0] === '--input') path = opts[1];
  else if (opts.length) return usage('`call` takes only --input <file>');

  let text: string;
  try {
    text = await io.readInput(path);
  } catch (e) {
    return usage(`Cannot read the input${e instanceof Error && e.message ? `: ${e.message}` : ''}`);
  }
  let args: unknown;
  try {
    args = text.trim() === '' ? {} : JSON.parse(text);
  } catch {
    const result = executeTool(name, undefined);
    if (!result.ok && result.error.code === 'unknown_tool') return { code: 1, stdout: json(result), stderr: '' };
    return { code: 1, stdout: json({ ok: false, tool: name, version: result.version, error: { code: 'invalid_input', message: 'The input is not valid JSON' } }), stderr: '' };
  }
  const result = executeTool(name, args);
  return { code: result.ok ? 0 : 1, stdout: json(result), stderr: '' };
}
