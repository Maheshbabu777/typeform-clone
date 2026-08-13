"use client";

import React, { useState, useEffect } from "react";
import { PublicForm } from "@/lib/types";

interface ThankYouEditorProps {
  form: PublicForm;
  onChange: (updates: Partial<PublicForm>) => void;
}

export function ThankYouEditor({ form, onChange }: ThankYouEditorProps) {
  const [text, setText] = useState(form.thank_you_text || "");

  useEffect(() => {
    setText(form.thank_you_text || "");
  }, [form.thank_you_text]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (text !== (form.thank_you_text || "")) {
        onChange({ thank_you_text: text || null });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [text, form.thank_you_text, onChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#dedcde] p-4">
        <h2 className="text-sm font-semibold text-[#3c323e]">Quiz Endings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thank You Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full resize-y rounded-md border border-[#dedcde] px-3 py-2 text-sm focus:border-[#a25fba] focus:outline-none focus:ring-1 focus:ring-[#a25fba]"
              placeholder="Thanks for completing this form"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
