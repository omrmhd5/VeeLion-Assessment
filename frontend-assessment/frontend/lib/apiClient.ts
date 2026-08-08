import type { ErrorResponse } from "@/types/api";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;

    try {
      const body = (await response.json()) as ErrorResponse;
      message = body.error?.message || message;
    } catch {
      // Response body was not JSON — keep the status-based message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
