"use client";

import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

interface AnswerInputProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value?: string | React.MouseEvent | React.FormEvent) => void;
  autoFocus?: boolean;
}

function ChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full border px-4 py-3 text-left transition-colors duration-150 flex items-center",
        "text-[length:var(--rx-font-description-mobile)] lg:text-[length:var(--rx-font-description)]",
        selected ? "border-[var(--rx-answer)] bg-[var(--rx-bg-active)]" : "border-transparent",
      )}
      style={{
        borderRadius: "var(--rx-radius)",
        backgroundColor: selected ? undefined : "var(--rx-answer-idle)",
        color: "var(--rx-question)",
      }}
      onMouseEnter={(event) => {
        if (!selected) {
          event.currentTarget.style.backgroundColor = "var(--rx-answer-hover)";
        }
      }}
      onMouseLeave={(event) => {
        if (!selected) {
          event.currentTarget.style.backgroundColor = "var(--rx-answer-idle)";
        }
      }}
    >
      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded border border-current/30 text-xs font-medium">
        {label.slice(0, 1).toUpperCase()}
      </span>
      {label}
    </button>
  );
}

export function AnswerInput({
  question,
  value,
  onChange,
  onSubmit,
  autoFocus = true,
}: AnswerInputProps) {
  const inputClassName = cn(
    "w-full border-0 border-b border-[color:var(--rx-question)]/30 bg-transparent py-2 outline-none transition-all",
    "focus:border-b-2 focus:border-[color:var(--rx-answer)] focus:ring-0",
    "text-[length:var(--rx-font-input-mobile)] lg:text-[length:var(--rx-font-input)]",
    "placeholder:text-[color:var(--rx-question)]/40",
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && question.type !== "long_text") {
      event.preventDefault();
      onSubmit();
    }
  };

  switch (question.type) {
    case "short_text":
      return (
        <input
          autoFocus={autoFocus}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClassName}
          style={{ color: "var(--rx-question)" }}
          placeholder="Type your answer here..."
        />
      );

    case "long_text":
      return (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus={autoFocus}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                onSubmit();
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
            rows={1}
            className={cn(inputClassName, "resize-none overflow-hidden leading-relaxed")}
            style={{ color: "var(--rx-question)" }}
            placeholder="Type your answer here..."
          />
          <span
            className="text-[12px] font-medium"
            style={{ color: "var(--rx-question)", opacity: 0.6 }}
          >
            <strong>Shift ⇧</strong> + <strong>Enter ↵</strong> to make a line break
          </span>
        </div>
      );

    case "email":
      return (
        <input
          autoFocus={autoFocus}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClassName}
          style={{ color: "var(--rx-question)" }}
          placeholder="name@example.com"
        />
      );

    case "number":
      return (
        <input
          autoFocus={autoFocus}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClassName}
          style={{ color: "var(--rx-question)" }}
          placeholder="0"
        />
      );

    case "multiple_choice":
      return (
        <div className="flex w-fit min-w-[200px] flex-col gap-2">
          {question.options.map((option) => (
            <ChoiceButton
              key={option}
              label={option}
              selected={value === option}
              onClick={() => {
                onChange(option);
                setTimeout(() => onSubmit(option), 120);
              }}
            />
          ))}
        </div>
      );

    case "dropdown":
      return (
        <select
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => {
            const val = event.target.value;
            onChange(val);
            if (val) {
              setTimeout(() => onSubmit(val), 120);
            }
          }}
          className={cn(
            inputClassName,
            "cursor-pointer appearance-none py-3",
            !value && "text-[color:var(--rx-question)]/40",
          )}
          style={{ color: "var(--rx-question)" }}
        >
          <option value="">Select an option</option>
          {question.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case "yes_no":
      return (
        <div className="flex w-fit min-w-[200px] flex-col gap-2 sm:flex-row">
          {["Yes", "No"].map((option) => (
            <ChoiceButton
              key={option}
              label={option}
              selected={value === option}
              onClick={() => {
                onChange(option);
                setTimeout(() => onSubmit(option), 120);
              }}
            />
          ))}
        </div>
      );

    case "rating": {
      const maxRating = Number(question.settings.max ?? question.settings.scale_max ?? 5);
      const safeMax = Number.isFinite(maxRating) && maxRating > 0 ? maxRating : 5;
      const options = Array.from({ length: safeMax }, (_, index) => String(index + 1));

      return (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setTimeout(() => onSubmit(option), 120);
              }}
              className={cn(
                "flex h-12 min-w-12 items-center justify-center px-4 transition-colors duration-150",
                value === option ? "bg-[var(--rx-bg-active)]" : "bg-[var(--rx-answer-idle)]",
              )}
              style={{
                borderRadius: "var(--rx-radius)",
                color: "var(--rx-question)",
                border: value === option ? "2px solid var(--rx-answer)" : "2px solid transparent",
              }}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
