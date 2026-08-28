import { isRecord } from "./response-guards";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 400:
      return "Please check your details and try again.";
    case 401:
      return "Your session is no longer valid. Please log in again.";
    case 403:
      return "You do not have access to this resource.";
    case 404:
      return "The requested resource could not be found.";
    case 409:
      return "This action conflicts with the current state. Please try again.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    default:
      return "CPS Academy is temporarily unavailable. Please try again.";
  }
}

export function parseStrapiError(status: number, payload: unknown): ApiError {
  // Server failures must never expose internal messages or response details.
  if (status >= 500) return new ApiError(status, fallbackMessage(status));

  const error = isRecord(payload) && isRecord(payload.error) ? payload.error : payload;
  const message = isRecord(error) && typeof error.message === "string" && error.message.trim()
    ? error.message
    : fallbackMessage(status);
  const code = isRecord(error) && typeof error.name === "string" ? error.name : null;
  return new ApiError(status, message, code);
}

export function requestErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "We could not complete this request. Please try again.";
}
