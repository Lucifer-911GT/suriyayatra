// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * The JSON Schema subset the tool inputs use, and a validator for it. Tool arguments come from
 * an AI model or another program, so they are checked here before any calculation: unknown
 * fields, wrong types and out-of-range numbers are refused with a path, never guessed at.
 */

export type JsonSchema = {
  type?: 'object' | 'array' | 'string' | 'integer' | 'number' | 'boolean' | 'null';
  description?: string;
  properties?: Readonly<Record<string, JsonSchema>>;
  required?: readonly string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  enum?: readonly (string | number | boolean | null)[];
  minimum?: number;
  maximum?: number;
  anyOf?: readonly JsonSchema[];
  $schema?: string;
};

export interface SchemaIssue {
  /** JSON-pointer-like path, e.g. "/date/month". */
  path: string;
  message: string;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

function typeOk(type: NonNullable<JsonSchema['type']>, v: unknown): boolean {
  switch (type) {
    case 'object': return isPlainObject(v);
    case 'array': return Array.isArray(v);
    case 'string': return typeof v === 'string';
    case 'integer': return Number.isInteger(v);
    case 'number': return typeof v === 'number' && Number.isFinite(v);
    case 'boolean': return typeof v === 'boolean';
    case 'null': return v === null;
  }
}

/** The first problem with `value` against `schema`, or null. Messages never repeat the value. */
export function validate(schema: JsonSchema, value: unknown, path = ''): SchemaIssue | null {
  const at = path || '/';
  if (schema.anyOf) {
    return schema.anyOf.some((s) => validate(s, value, path) === null) ? null : { path: at, message: 'does not match any allowed form' };
  }
  if (schema.type && !typeOk(schema.type, value)) return { path: at, message: `must be ${schema.type === 'integer' ? 'a whole number' : `a ${schema.type}`}` };
  if (schema.enum && !schema.enum.includes(value as never)) return { path: at, message: `must be one of ${schema.enum.join(', ')}` };
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) return { path: at, message: `must be ≥ ${schema.minimum}` };
    if (schema.maximum !== undefined && value > schema.maximum) return { path: at, message: `must be ≤ ${schema.maximum}` };
  }
  if (Array.isArray(value)) return validateArray(schema, value, path);
  if (isPlainObject(value)) return validateObject(schema, value, path);
  return null;
}

function validateArray(schema: JsonSchema, value: unknown[], path: string): SchemaIssue | null {
  const at = path || '/';
  if (schema.minItems !== undefined && value.length < schema.minItems) return { path: at, message: `needs at least ${schema.minItems} items` };
  if (schema.maxItems !== undefined && value.length > schema.maxItems) return { path: at, message: `takes at most ${schema.maxItems} items` };
  if (schema.uniqueItems && new Set(value).size !== value.length) return { path: at, message: 'items must not repeat' };
  if (schema.items) {
    for (let i = 0; i < value.length; i++) {
      const issue = validate(schema.items, value[i], `${path}/${i}`);
      if (issue) return issue;
    }
  }
  return null;
}

function validateObject(schema: JsonSchema, value: Record<string, unknown>, path: string): SchemaIssue | null {
  for (const key of schema.required ?? []) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) return { path: `${path}/${key}`, message: 'is required' };
  }
  const props = schema.properties ?? {};
  for (const key of Object.keys(value)) {
    const sub = Object.prototype.hasOwnProperty.call(props, key) ? props[key] : undefined;
    if (sub) {
      const issue = validate(sub, value[key], `${path}/${key}`);
      if (issue) return issue;
    } else if (schema.additionalProperties === false) {
      return { path: path || '/', message: 'has a field that is not allowed' };
    } else if (typeof schema.additionalProperties === 'object') {
      const issue = validate(schema.additionalProperties, value[key], `${path}/${key}`);
      if (issue) return issue;
    }
  }
  return null;
}

// ── shared pieces ───────────────────────────────────────────────────────────

const int = (description: string, minimum: number, maximum: number): JsonSchema => ({ type: 'integer', description, minimum, maximum });
const str = (description: string): JsonSchema => ({ type: 'string', description });
const obj = (properties: Record<string, JsonSchema>, required: string[], description?: string): JsonSchema =>
  ({ type: 'object', ...(description ? { description } : {}), properties, required, additionalProperties: false });

export const S = { int, str, obj };

export const DATE: JsonSchema = obj({
  year: int('Common Era (ค.ศ.) year; add 543 for พ.ศ.', -1_000_000, 1_000_000),
  month: int('Month 1–12', 1, 12),
  day: int('Day of the month', 1, 31),
}, ['year', 'month', 'day'], 'A calendar date (Gregorian)');

export const TIME: JsonSchema = obj({
  hour: int('Hour 0–23, Thai standard time (UTC+7)', 0, 23),
  minute: int('Minute 0–59', 0, 59),
}, ['hour', 'minute'], 'Clock time in Thai standard time (UTC+7)');

export const PLACE: JsonSchema = obj({
  province: int('Official Thai province code (กรุงเทพมหานคร = 10)', 10, 96),
  lat: { type: 'number', description: 'Latitude, degrees north', minimum: -90, maximum: 90 },
  lon: { type: 'number', description: 'Longitude, degrees east', minimum: -180, maximum: 180 },
}, [], 'Where, for the real sunrise: a Thai province code, or lat and lon together');


/** Output pieces (described loosely enough to stay true as fields are added). */
export const OUT_DATE: JsonSchema = obj({ year: { type: 'integer' }, month: { type: 'integer' }, day: { type: 'integer' } }, ['year', 'month', 'day']);
export const OUT_THAI_CLOCK: JsonSchema = obj({ date: OUT_DATE, time: str('HH:MM, Thai standard time (UTC+7)') }, ['date', 'time']);
export const OUT_POSITION: JsonSchema = {
  type: 'object',
  properties: {
    longitude: int('Arcminutes from 0° เมษ', 0, 21599), sign: int('0 = เมษ … 11 = มีน', 0, 11), signTh: str('Thai sign name'),
    degree: int('Degree within the sign', 0, 29), minute: int('Arcminute within the degree', 0, 59),
  },
  required: ['longitude', 'sign', 'signTh', 'degree', 'minute'],
};
