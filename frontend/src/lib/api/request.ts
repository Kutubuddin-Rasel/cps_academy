import { getStrapiUrl } from "@/lib/env/public-env";
import { ApiError, parseStrapiError } from "./error";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}): Promise<unknown> {
  let origin: string;
  try {
    origin = getStrapiUrl();
  } catch (error: unknown) {
    throw new ApiError(0, error instanceof Error ? error.message : "The API origin is not configured.");
  }
  if (!endpoint.startsWith("/") || endpoint.startsWith("//") || endpoint.includes("\\")) {
    throw new ApiError(0, "Invalid API request path.");
  }

  const { body, token, headers: customHeaders, signal, ...rest } = options;
  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const timeout = AbortSignal.timeout(15_000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const init: RequestInit = { ...rest, headers, signal: requestSignal, cache: "no-store", credentials: "omit" };
  if (body !== undefined) init.body = JSON.stringify(body);

  let response: Response;
  try {
    response = await fetch(`${origin}${endpoint}`, init);
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
