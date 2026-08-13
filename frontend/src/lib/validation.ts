import type { Question } from "@/lib/types";

export function validateAnswer(question: Question, rawValue: string): string | null {
  const value = rawValue.trim();

  if (question.required && !value) {
    return "This field is required.";
  }

  if (!value) return null;

  if (question.type === "email") {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return "Please enter a valid email address.";
    }
  }

  if (question.type === "number") {
    if (Number.isNaN(Number(value))) {
      return "Please enter a valid number.";
    }
  }

  return null;
}
