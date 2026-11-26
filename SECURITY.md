# Security

## Reporting a vulnerability

Please do not open a public issue. Use **Report a vulnerability** on the repository's
**Security** tab (GitHub private vulnerability reporting), with the version, the call that
misbehaves and what you expected. You should get a reply within a week.

Only the latest release receives fixes.

## What the engine guarantees

suriyayatra is pure computation: no network, file system, `eval`, regular expressions or
runtime dependencies, and no install scripts.

- **Bad input is refused.** Every exported function either returns a result or throws a
  `RangeError`; junk input (wrong types, `NaN`, `null`, huge numbers, unknown names) never
  causes another kind of error or a silent wrong answer. A fuzz test (`test/security.test.ts`)
  checks this for every export.
- **Error messages do not echo the input**, so they are safe to log or return to a client.
- **Work per call is bounded.** Span functions take at most `maxDays` (default
  `DEFAULT_MAX_DAYS`, about ten years) and `settleMinutes` at most `MAX_SETTLE_MINUTES`;
  repeated body names are counted once; dates are limited to ±`MAX_ABS_YEAR` years so every
  intermediate value stays an exact integer. With the defaults the slowest call
  (`ingresses` for all ten bodies over ten years) takes about 0.15 s on a laptop.
- **Tables cannot be tampered with.** Exported tables (`BODIES`, `SUN_EQUATION`,
  `OFFICIAL_YEAR_TYPES`, `RISING_SAMANYA`, …) are frozen, so other code in the same process
  cannot change the results.

## AI tools and the command line

`suriyayatra/tools` and the `suriyayatra` CLI are meant for input you do not control, such as
arguments written by an AI model:

- The arguments are copied once as plain JSON (getters and proxies are read a single time, or
  refused), and that copy is checked against the tool's JSON Schema and is what the tool runs on.
  Unknown fields (including `__proto__`), wrong types and out-of-range numbers are refused with a
  path.
- `executeTool` never throws. It returns `{ ok: false, error: { code, message } }`, and the
  message does not repeat the input.
- Spans are capped by `TOOL_LIMITS` (400 days of holy days, 366 days of sign changes, 3,660
  days of retrogrades). The caller cannot raise them; there is no `maxDays` argument.
- The CLI reads its input in chunks and stops past 1 MB, so a huge pipe, `/dev/zero` or a FIFO
  cannot make it hold more; it writes only to stdout and stderr.

## Releases

Releases are built by `.github/workflows/publish.yml` from a version tag on `main` and only
*staged* on npm through Trusted Publishing (no npm token exists); a maintainer approves each one
with 2FA before anyone can install it, and npm attaches provenance. The checks run in a job without
OIDC permission; the job that can mint the token runs no package scripts. Actions are pinned to
commits.

## Using it on a server

- Do not pass a client-supplied `maxDays` straight through: it is the knob that lets a caller
  ask for more work. Keep the default or set your own ceiling.
- Rate-limit endpoints that call `ingresses` or `retrogrades`; each call is bounded, but many
  calls are still many calls.
- Treat results outside `VALIDATED_RANGES` as computed, not verified against published data.
