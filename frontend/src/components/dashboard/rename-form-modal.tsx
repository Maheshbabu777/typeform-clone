"use client";

import React, { useState, useEffect } from "react";
import { updateForm } from "@/lib/api-creator";
import { X, Loader2 } from "lucide-react";
import type { FormSummary } from "@/lib/types";

interface RenameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormSummary;
  onSuccess: () => void;
}

export function RenameFormModal({ isOpen, onClose, form, onSuccess }: RenameFormModalProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(form.title);
    }
  }, [isOpen, form.title]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim() === form.title) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateForm(form.id, { title: title.trim() });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#3c323e]">Rename form</h2>
          <button 
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Form Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Customer Feedback Survey"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-[#a25fba] focus:outline-none focus:ring-1 focus:ring-[#a25fba]"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex items-center gap-2 rounded-md bg-[#a25fba] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#9454ab] disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
