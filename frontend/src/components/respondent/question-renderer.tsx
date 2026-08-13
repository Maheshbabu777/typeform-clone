"use client";

import { AnswerInput } from "@/components/respondent/answer-input";
import type { Question } from "@/lib/types";

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  showOkButton: boolean;
  isSubmitting: boolean;
}

export function QuestionRenderer({
  question,
  questionNumber,
  value,
  error,
  onChange,
  onSubmit,
  showOkButton,
  isSubmitting,
}: QuestionRendererProps) {
  const autoAdvanceTypes = new Set([
    "multiple_choice",
    "dropdown",
    "yes_no",
    "rating",
  ] as const);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p
          className="text-[length:var(--rx-font-helper)]"
          style={{ color: "var(--rx-question)", opacity: 0.7 }}
        >
          {questionNumber} →
        </p>
        <h2
          className="font-normal leading-tight text-[length:var(--rx-font-question-title-mobile)] lg:text-[length:var(--rx-font-question-title)]"
          style={{ color: "var(--rx-question)" }}
        >
          {question.title}
          {question.required ? <span aria-hidden="true"> *</span> : null}
        </h2>
        {question.description ? (
          <p
            className="leading-relaxed text-[length:var(--rx-font-description-mobile)] lg:text-[length:var(--rx-font-description)]"
            style={{ color: "var(--rx-question)", opacity: 0.75 }}
          >
            {question.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <AnswerInput
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
        />

        {error ? (
          <p
            className="text-[length:var(--rx-font-helper)]"
            style={{ color: "#e53e3e" }}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {showOkButton && !autoAdvanceTypes.has(question.type as never) ? (
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 font-medium transition-opacity disabled:opacity-60"
              style={{
                borderRadius: "var(--rx-radius)",
                backgroundColor: "var(--rx-button)",
                color: "var(--rx-button-content)",
              }}
            >
              OK
              <span aria-hidden="true">↵</span>
            </button>
            <span
              className="hidden text-[length:var(--rx-font-helper)] sm:inline"
              style={{ color: "var(--rx-question)", opacity: 0.55 }}
            >
              press <strong>Enter ↵</strong>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
