import type {
  PublicForm,
  FormUpdatePayload,
  Question,
  QuestionCreatePayload,
  QuestionUpdatePayload,
  LogicRule,
  LogicRuleCreatePayload,
  FormSummary,
  ResponseSummary,
  QuestionStats,
} from "@/lib/types";

// Reuse the same base logic as the public API but without throwing away the error logic.
// In a real app we'd share this fetch wrapper, but we'll duplicate the simple wrapper here for separation.
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
      const body = (await response.json()) as { detail?: any };
      if (body.detail) {
        detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // ignore
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export async function listForms(): Promise<FormSummary[]> {
  return request<FormSummary[]>("/forms");
}

export async function createForm(title: string): Promise<PublicForm> {
  return request<PublicForm>("/forms", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function getForm(id: number): Promise<PublicForm> {
  return request<PublicForm>(`/forms/${id}`);
}

export async function updateForm(id: number, payload: FormUpdatePayload): Promise<PublicForm> {
  return request<PublicForm>(`/forms/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteForm(id: number): Promise<void> {
  return request<void>(`/forms/${id}`, { method: "DELETE" });
}

export async function duplicateForm(id: number): Promise<PublicForm> {
  return request<PublicForm>(`/forms/${id}/duplicate`, { method: "POST" });
}

export async function publishForm(id: number): Promise<{ public_slug: string }> {
  return request<{ public_slug: string }>(`/forms/${id}/publish`, { method: "POST" });
}

export async function unpublishForm(id: number): Promise<void> {
  return request<void>(`/forms/${id}/unpublish`, { method: "POST" });
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export async function createQuestion(formId: number, payload: QuestionCreatePayload): Promise<Question> {
  return request<Question>(`/forms/${formId}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuestion(questionId: number, payload: QuestionUpdatePayload): Promise<Question> {
  return request<Question>(`/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuestion(questionId: number): Promise<void> {
  return request<void>(`/questions/${questionId}`, { method: "DELETE" });
}

export async function reorderQuestions(formId: number, orderedIds: number[]): Promise<void> {
  return request<void>(`/forms/${formId}/questions/reorder`, {
    method: "PUT",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

// ---------------------------------------------------------------------------
// Logic
// ---------------------------------------------------------------------------

export async function createLogicRule(formId: number, payload: LogicRuleCreatePayload): Promise<LogicRule> {
  return request<LogicRule>(`/forms/${formId}/logic`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteLogicRule(logicId: number): Promise<void> {
  return request<void>(`/logic/${logicId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Results & Analytics
// ---------------------------------------------------------------------------

export async function listFormResponses(formId: number): Promise<ResponseSummary[]> {
  return request<ResponseSummary[]>(`/forms/${formId}/responses`);
}

export async function getFormStats(formId: number): Promise<QuestionStats[]> {
  return request<QuestionStats[]>(`/forms/${formId}/stats`);
}

export function getCsvExportUrl(formId: number): string {
  return `${API_BASE}/forms/${formId}/export.csv`;
}
