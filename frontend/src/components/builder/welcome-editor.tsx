"use client";

import React, { useState, useEffect } from "react";
import { PublicForm } from "@/lib/types";

interface WelcomeEditorProps {
  form: PublicForm;
  onChange: (updates: Partial<PublicForm>) => void;
}

export function WelcomeEditor({ form, onChange }: WelcomeEditorProps) {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description || "");

  useEffect(() => {
    setTitle(form.title);
    setDescription(form.description || "");
  }, [form.title, form.description]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (title !== form.title || description !== (form.description || "")) {
        onChange({ 
          title: title.trim() || "Untitled Form", 
          description: description || null 
        });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [title, description, form.title, form.description, onChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#dedcde] p-4">
        <h2 className="text-sm font-semibold text-[#3c323e]">Welcome Screen</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#dedcde] px-3 py-2 text-sm focus:border-[#a25fba] focus:outline-none focus:ring-1 focus:ring-[#a25fba]"
              placeholder="Welcome to our form!"
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
              placeholder="Takes X minutes to complete..."
              rows={3}
            />
          </div>
          
          <div className="pt-4 border-t border-[#dedcde]">
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
              Button Text
            </label>
            <input
              type="text"
              value="Start"
              disabled
              className="w-full rounded-md border border-[#dedcde] bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">Custom button text coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
