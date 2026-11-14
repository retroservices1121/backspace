import type { ZodType, ZodTypeDef } from 'zod';
import { ApiError } from './errors';

/** Minimal response shape the client needs; satisfied by WHATWG fetch and `expo/fetch`. */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export interface FetchInitLike {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export type FetchLike = (url: string, init: FetchInitLike) => Promise<FetchResponseLike>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions {
  /** Base URL including the `/api` prefix, e.g. https://backspace.to/api */
  baseUrl: string;
  /** Returns the current access token, or null when signed out. */
  getToken: () => Promise<string | null>;
  fetch: FetchLike;
}

export interface RequestOptions<T> {
  method?: HttpMethod;
  /** Serialised as JSON when present. */
  body?: unknown;
  /** Validates (and may transform) the parsed JSON response. */
  schema?: ZodType<T, ZodTypeDef, unknown>;
  /** Sends `Authorization: Bearer <token>`. Defaults to true. */
  auth?: boolean;
}

export interface ApiClient {
  readonly baseUrl: string;
  request<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
}

export function createApiClient({ baseUrl, getToken, fetch }: ApiClientOptions): ApiClient {
  const root = baseUrl.replace(/\/+$/, '');

  async function request<T = unknown>(path: string, options: RequestOptions<T> = {}): Promise<T> {
    const { method = 'GET', body, schema, auth = true } = options;
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (auth) {
      const token = await getToken();
      if (!token) throw new ApiError(401, 'Sign in to continue.', 'unauthorized');
      headers.Authorization = `Bearer ${token}`;
    }

    let payload: string | undefined;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    let response: FetchResponseLike;
    try {
      response = await fetch(`${root}${path.startsWith('/') ? path : `/${path}`}`, { method, headers, body: payload });
    } catch {
      throw new ApiError(0, 'Network request failed.', 'network_error');
    }

    // A body that cannot be read (e.g. an interrupted stream) is a failed request, never an empty success.
    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new ApiError(0, 'Network request failed.', 'network_error');
    }
    const json = parseJson(text);

    if (!response.ok) {
      if (response.status === 401) throw new ApiError(401, 'Sign in to continue.', 'unauthorized');
      const details = isRecord(json) ? json : {};
      const message = stringField(details, 'message') ?? stringField(details, 'error') ?? `Request failed (${response.status}).`;
      throw new ApiError(response.status, message, stringField(details, 'code'));
    }

    if (!schema) return json as T;
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw new ApiError(response.status, 'Unexpected response from the server.', 'invalid_response');
    return parsed.data;
  }

  return { baseUrl: root, request };
}

/**
 * Parses a response body. An empty or non-JSON body yields `undefined`, so only a literal JSON `null`
 * can satisfy a nullable schema (an empty 200 is rejected as `invalid_response`).
 */
function parseJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
