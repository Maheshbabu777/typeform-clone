"use client";

import React, { useState, useEffect } from "react";
import { PublicForm, Question, QuestionUpdatePayload } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import { LogicJumpEditor } from "./logic-jump-editor";

interface QuestionEditorProps {
  form: PublicForm;
  question: Question;
  onChange: (updates: QuestionUpdatePayload) => void;
  onFormChange: (form: PublicForm) => void;
}

export function QuestionEditor({ form, question, onChange, onFormChange }: QuestionEditorProps) {
  // Local state for debounced title/description typing
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || "");

  // Sync local state when question changes
  useEffect(() => {
    setTitle(question.title);
    setDescription(question.description || "");
    // Sync only when the selected question changes; title/description echo back through debounced saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // Use a simple timeout for debouncing text changes
  useEffect(() => {
    const handler = setTimeout(() => {
      const proposedTitle = title || "Untitled Question";
      const proposedDesc = description || undefined;
      
      if (proposedTitle !== question.title || proposedDesc !== (question.description || undefined)) {
        onChange({ 
          title: proposedTitle, 
          description: proposedDesc 
        });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [title, description, question.title, question.description, onChange]);

  const hasOptions = question.type === "multiple_choice" || question.type === "dropdown";
  const hasSettings = question.type === "rating";

  const handleAddOption = () => {
    const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
    onChange({ options: newOptions });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    onChange({ options: newOptions });
  };

  const handleDeleteOption = (index: number) => {
    const newOptions = [...(question.options || [])];
    newOptions.splice(index, 1);
    onChange({ options: newOptions });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-card-foreground">Question Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title & Description */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Question
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. What is your name?"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Add more details..."
              rows={2}
            />
          </div>
        </div>

        {/* Required Toggle */}
        {question.type !== "statement" && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-card-foreground">Required</label>
            <button
              onClick={() => onChange({ required: !question.required })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                question.required ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  question.required ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}

        {/* Options Editor for Choice Types */}
        {hasOptions && (
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Choices
            </label>
            <div className="space-y-2">
              {(question.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleUpdateOption(idx, e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => handleDeleteOption(idx)}
                    className="text-muted-foreground hover:text-red-500"
                    disabled={(question.options || []).length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddOption}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4" /> Add choice
            </button>
          </div>
        )}

        {/* Settings for Rating Type */}
        {hasSettings && question.type === "rating" && (
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Scale Maximum
            </label>
            <select
              value={question.settings?.max as string || "5"}
              onChange={(e) => onChange({ settings: { ...question.settings, max: e.target.value } })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n.toString()}>{n}</option>
              ))}
            </select>
          </div>
        )}

        {/* Logic Jumps */}
        <div className="border-t border-border pt-6 pb-6">
          <h3 className="mb-2 text-sm font-semibold text-card-foreground">Logic Jumps</h3>
          <LogicJumpEditor 
            form={form} 
            question={question} 
            onFormChange={onFormChange} 
          />
        </div>

      </div>
    </div>
  );
}
