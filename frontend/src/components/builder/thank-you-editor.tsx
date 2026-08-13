"use client";

import React, { useState, useEffect } from "react";
import { PublicForm } from "@/lib/types";

interface ThankYouEditorProps {
  form: PublicForm;
  onChange: (updates: Partial<PublicForm>) => void;
}

export function ThankYouEditor({ form, onChange }: ThankYouEditorProps) {
  const [text, setText] = useState(form.thank_you_text || "");
  const thankYouDescription = form.settings?.thank_you_description as string | undefined;

  useEffect(() => {
    setText(form.thank_you_text || "");
    // Sync only when the selected form changes; text echoes back through debounced saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const proposedText = text || undefined;
      if (proposedText !== (form.thank_you_text || undefined)) {
        onChange({ 
          thank_you_text: proposedText,
          description: thankYouDescription || undefined
        });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [text, form.thank_you_text, thankYouDescription, onChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-medium text-card-foreground">Quiz Endings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Thank You Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Thanks for completing this form"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
