"use client";

import React, { useState, useEffect } from "react";
import { Question } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";

interface QuestionEditorProps {
  question: Question;
  onChange: (updates: Partial<Question>) => void;
}

export function QuestionEditor({ question, onChange }: QuestionEditorProps) {
  // Local state for debounced title/description typing
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || "");

  // Sync local state when question changes
  useEffect(() => {
    setTitle(question.title);
    setDescription(question.description || "");
  }, [question.id]);

  // Use a simple timeout for debouncing text changes
  useEffect(() => {
    const handler = setTimeout(() => {
      const proposedTitle = title || "Untitled Question";
      const proposedDesc = description || null;
      
      if (proposedTitle !== question.title || proposedDesc !== (question.description || null)) {
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
      <div className="border-b border-[#dedcde] p-4">
        <h2 className="text-sm font-semibold text-[#3c323e]">Question Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title & Description */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Question
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#dedcde] px-3 py-2 text-sm focus:border-[#a25fba] focus:outline-none focus:ring-1 focus:ring-[#a25fba]"
              placeholder="e.g. What is your name?"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-y rounded-md border border-[#dedcde] px-3 py-2 text-sm focus:border-[#a25fba] focus:outline-none focus:ring-1 focus:ring-[#a25fba]"
              placeholder="Add more details..."
              rows={2}
            />
          </div>
        </div>

        {/* Required Toggle */}
        {question.type !== "statement" && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#3c323e]">Required</label>
            <button
              onClick={() => onChange({ required: !question.required })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                question.required ? "bg-[#a25fba]" : "bg-gray-200"
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
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Choices
            </label>
            <div className="space-y-2">
              {(question.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleUpdateOption(idx, e.target.value)}
                    className="flex-1 rounded-md border border-[#dedcde] px-3 py-1.5 text-sm focus:border-[#a25fba] focus:outline-none focus:ring-1 focus:ring-[#a25fba]"
                  />
                  <button
                    onClick={() => handleDeleteOption(idx)}
                    className="text-gray-400 hover:text-red-500"
                    disabled={(question.options || []).length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddOption}
              className="flex items-center gap-1 text-sm font-medium text-[#a25fba] hover:text-[#9454ab]"
            >
              <Plus className="h-4 w-4" /> Add choice
            </button>
          </div>
        )}

        {/* Settings for Rating Type */}
        {hasSettings && question.type === "rating" && (
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Scale Maximum
            </label>
            <select
              value={question.settings?.max as string || "5"}
              onChange={(e) => onChange({ settings: { ...question.settings, max: e.target.value } })}
              className="w-full rounded-md border border-[#dedcde] px-3 py-2 text-sm focus:border-[#a25fba] focus:outline-none focus:ring-1 focus:ring-[#a25fba]"
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n.toString()}>{n}</option>
              ))}
            </select>
          </div>
        )}

        {/* Logic Jumps Placeholder */}
        <div className="pt-6 border-t border-[#dedcde]">
          <h3 className="text-sm font-semibold text-[#3c323e] mb-2">Logic Jumps</h3>
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">
              Logic jumps allow you to redirect respondents based on their answers.
            </p>
            <button className="mt-3 text-sm font-medium text-[#a25fba] opacity-50 cursor-not-allowed">
              + Add logic jump (Coming Soon)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
