"use client";

interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-20 h-1"
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full transition-[width] duration-300 ease-out"
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: "var(--rx-button)",
        }}
      />
    </div>
  );
}
