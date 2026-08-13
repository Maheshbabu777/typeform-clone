import type { PublicForm, PublicSubmitPayload } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getPublicForm(slug: string): Promise<PublicForm> {
  return request<PublicForm>(`/public/${slug}`);
}

export async function startPublicResponse(slug: string): Promise<{ response_id: number }> {
  return request<{ response_id: number }>(`/public/${slug}/start`, { method: "POST" });
}

export async function submitPublicResponse(
  slug: string,
  payload: PublicSubmitPayload,
): Promise<{ response_id: number; completed: boolean }> {
  return request<{ response_id: number; completed: boolean }>(`/public/${slug}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export { ApiError };
