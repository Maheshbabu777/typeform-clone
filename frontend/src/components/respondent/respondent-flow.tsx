"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import { ProgressBar } from "@/components/respondent/progress-bar";
import { QuestionRenderer } from "@/components/respondent/question-renderer";
import { ThemeProvider } from "@/components/respondent/theme-provider";
import { startPublicResponse, submitPublicResponse } from "@/lib/api";
import { getNextQuestionId, getProgressValue } from "@/lib/logic";
import type { PublicForm } from "@/lib/types";
import { validateAnswer } from "@/lib/validation";
import { cn } from "@/lib/utils";

type FlowPhase = "landing" | "question" | "submitting" | "thank_you";

interface RespondentFlowProps {
  form: PublicForm;
  slug: string;
}

const AUTO_ADVANCE_TYPES = new Set([
  "multiple_choice",
  "dropdown",
  "yes_no",
  "rating",
]);

export function RespondentFlow({ form, slug }: RespondentFlowProps) {
  const sortedQuestions = useMemo(
    () => [...form.questions].sort((a, b) => a.order_index - b.order_index),
    [form.questions],
  );

  const [phase, setPhase] = useState<FlowPhase>("landing");
  const [responseId, setResponseId] = useState<number | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(
    sortedQuestions[0]?.id ?? null,
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [draftValue, setDraftValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = sortedQuestions.find((question) => question.id === currentQuestionId);
  const currentQuestionNumber =
    currentQuestion ? sortedQuestions.findIndex((question) => question.id === currentQuestion.id) + 1 : 0;

  const progress = useMemo(() => {
    if (!currentQuestionId || phase !== "question") return 0;
    return getProgressValue(currentQuestionId, sortedQuestions, form.logic, answers);
  }, [answers, currentQuestionId, form.logic, phase, sortedQuestions]);

  const beginForm = useCallback(async () => {
    setSubmitError(null);
    if (sortedQuestions.length === 0) {
      setPhase("thank_you");
      return;
    }

    try {
      const started = await startPublicResponse(slug);
      setResponseId(started.response_id);
    } catch {
      // Submission still works without response_id per API contract.
    }

    setCurrentQuestionId(sortedQuestions[0].id);
    setDraftValue("");
    setError(null);
    setPhase("question");
    setAnimationKey((key) => key + 1);
  }, [slug, sortedQuestions]);

  const finishForm = useCallback(
    async (finalAnswers: Record<number, string>) => {
      setPhase("submitting");
      setSubmitError(null);

      const payload = {
        response_id: responseId ?? undefined,
        answers: Object.entries(finalAnswers)
          .filter(([, value]) => value.trim())
          .map(([questionId, value]) => ({
            question_id: Number(questionId),
            value: value.trim(),
          })),
      };

      try {
        await submitPublicResponse(slug, payload);
        setPhase("thank_you");
        setAnimationKey((key) => key + 1);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Unable to submit your answers.");
        setPhase("question");
      }
    },
    [responseId, slug],
  );

  const advance = useCallback((overrideValue?: string | React.MouseEvent | React.FormEvent) => {
    if (!currentQuestion) return;

    const actualValue = typeof overrideValue === "string" ? overrideValue : draftValue;

    const validationError = validateAnswer(currentQuestion, actualValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmed = actualValue.trim();
    const nextAnswers = { ...answers };
    if (trimmed) {
      nextAnswers[currentQuestion.id] = trimmed;
    } else {
      delete nextAnswers[currentQuestion.id];
    }

    setAnswers(nextAnswers);
    setError(null);

    const nextQuestionId = getNextQuestionId(
      currentQuestion.id,
      sortedQuestions,
      form.logic,
      nextAnswers,
    );

    if (nextQuestionId === null) {
      startTransition(() => {
        void finishForm(nextAnswers);
      });
      return;
    }

    setCurrentQuestionId(nextQuestionId);
    setDraftValue(nextAnswers[nextQuestionId] ?? "");
    setAnimationKey((key) => key + 1);
  }, [answers, currentQuestion, draftValue, finishForm, form.logic, sortedQuestions]);

  const showOkButton = currentQuestion ? !AUTO_ADVANCE_TYPES.has(currentQuestion.type) : false;

  return (
    <ThemeProvider form={form}>
      {phase === "question" || phase === "submitting" ? <ProgressBar value={progress} /> : null}

      <main className="flex min-h-dvh w-full items-center justify-center px-6 py-16 lg:px-12">
        <div
          key={animationKey}
          className={cn(
            "w-full animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both ease-out",
          )}
        >
          {phase === "landing" ? (
            <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center gap-8">
              <div className="flex flex-col gap-4">
                <h1
                  className="text-[length:var(--rx-font-question-title-mobile)] font-normal leading-tight lg:text-[length:var(--rx-font-question-title)]"
                  style={{ color: "var(--rx-question)" }}
                >
                  {form.title}
                </h1>
                {form.description ? (
                  <p
                    className="leading-relaxed text-[length:var(--rx-font-description-mobile)] lg:text-[length:var(--rx-font-description)]"
                    style={{ color: "var(--rx-question)", opacity: 0.75 }}
                  >
                    {form.description}
                  </p>
                ) : null}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    void beginForm();
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 font-medium"
                  style={{
                    borderRadius: "var(--rx-radius)",
                    backgroundColor: "var(--rx-button)",
                    color: "var(--rx-button-content)",
                  }}
                >
                  Start
                </button>
              </div>
            </section>
          ) : null}

          {phase === "question" || phase === "submitting" ? (
            currentQuestion ? (
              <QuestionRenderer
                question={currentQuestion}
                questionNumber={currentQuestionNumber}
                value={draftValue}
                error={error ?? submitError}
                onChange={(value) => {
                  setDraftValue(value);
                  if (error) setError(null);
                  if (submitError) setSubmitError(null);
                }}
                onSubmit={advance}
                showOkButton={showOkButton}
                isSubmitting={phase === "submitting" || isPending}
              />
            ) : null
          ) : null}

          {phase === "thank_you" ? (
            <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center gap-4">
              <h1
                className="text-[length:var(--rx-font-question-title-mobile)] font-normal leading-tight lg:text-[length:var(--rx-font-question-title)]"
                style={{ color: "var(--rx-question)" }}
              >
                {form.thank_you_text}
              </h1>
            </section>
          ) : null}
        </div>
      </main>
    </ThemeProvider>
  );
}
