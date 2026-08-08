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
    try {
      const body = (await response.json()) as ErrorResponse;
      throw new Error(
        body.error?.message || `Request failed with ${response.status}`,
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(error, `Request failed with ${response.status}`),
      );
    }
  }

  return (await response.json()) as T;
}
