#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
// The suriyayatra command: reads files and stdin, prints what src/cli.ts decides.
import { createReadStream } from 'node:fs';
import { runCli } from '../dist/cli.js';

const MAX_INPUT_BYTES = 1_000_000;

/**
 * Reads a file, or stdin, in chunks and stops as soon as it passes the cap, so a huge pipe,
 * /dev/zero or a FIFO cannot make the process hold more than about 1 MB.
 */
async function readInput(path) {
  const stream = path === undefined ? process.stdin : createReadStream(path, { end: MAX_INPUT_BYTES });
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_INPUT_BYTES) {
      stream.destroy();
      throw new Error('input is larger than 1 MB');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const result = await runCli(process.argv.slice(2), { readInput });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.code;
// stdin may still be open after an early stop; leave once the output is written.
process.stdout.write('', () => process.exit());
