import { getStrapiUrl } from "@/lib/env/public-env";
import { ApiError, parseStrapiError } from "./error";

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "cache" | "next"> {
  body?: unknown;
  token?: string;
}

async function executeApiRequest(
  endpoint: string,
  init: RequestInit,
  signal: AbortSignal | null | undefined,
  cachedPublicRequest: boolean,
): Promise<unknown> {
  let origin: string;
  try {
    origin = getStrapiUrl();
  } catch (error: unknown) {
    throw new ApiError(0, error instanceof Error ? error.message : "The API origin is not configured.");
  }
  if (!endpoint.startsWith("/") || endpoint.startsWith("//") || endpoint.includes("\\")) {
    throw new ApiError(0, "Invalid API request path.");
  }

  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  if (cachedPublicRequest && (method !== "GET" || init.body != null || headers.has("Authorization"))) {
    throw new ApiError(0, "Invalid cached public API request.");
  }

  const timeout = AbortSignal.timeout(15_000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const requestInit: RequestInit = { ...init, headers, signal: requestSignal, credentials: "omit" };

  let response: Response;
  try {
    response = await fetch(`${origin}${endpoint}`, requestInit);
  } catch (error: unknown) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, "Unable to reach CPS Academy. Check your connection and try again.");
  }

  let payload: unknown = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch (error: unknown) {
      if (signal?.aborted) throw error;
      if (response.ok) {
        throw new ApiError(502, "CPS Academy returned an unreadable response. Please try again.");
      }
    }
  }
  if (!response.ok) throw parseStrapiError(response.status, payload);
  return payload;
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}): Promise<unknown> {
  const { body, token, headers: customHeaders, signal, ...rest } = options;
  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const init: RequestInit = {
    ...rest,
    headers,
    cache: "no-store",
    next: undefined,
    credentials: "omit",
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  return executeApiRequest(endpoint, init, signal, false);
}

export async function publicApiRequest(endpoint: string, signal?: AbortSignal): Promise<unknown> {
  const courseDetailId = endpoint.startsWith("/api/catalog/courses/")
    ? endpoint.slice("/api/catalog/courses/".length)
    : "";
  const blogDetailId = endpoint.startsWith("/api/blog/")
    ? endpoint.slice("/api/blog/".length)
    : "";
  const hasQueryOrFragment = endpoint.includes("?") || endpoint.includes("#");
  const publicEndpoint = endpoint === "/api/catalog/courses"
    || endpoint === "/api/blog"
    || (!hasQueryOrFragment && courseDetailId.length > 0 && !courseDetailId.includes("/"))
    || (!hasQueryOrFragment && blogDetailId.length > 0 && blogDetailId !== "manage" && !blogDetailId.includes("/"));
  if (!publicEndpoint) {
    throw new ApiError(0, "Invalid cached public API path.");
  }

  const headers = new Headers({ Accept: "application/json" });
  return executeApiRequest(endpoint, {
    method: "GET",
    headers,
    cache: "force-cache",
    next: { revalidate: 60 },
    credentials: "omit",
  }, signal, true);
}
