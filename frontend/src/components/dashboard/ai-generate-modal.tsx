"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateFormWithAI } from "@/lib/api-creator";
import { X, Loader2, Wand2 } from "lucide-react";

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOADING_STATES = [
  "Connecting to AI...",
  "Designing form structure...",
  "Writing question logic...",
  "Applying Typeform aesthetics...",
  "Finalizing your form...",
];

export function AIGenerateModal({ isOpen, onClose }: AIGenerateModalProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStateIndex, setLoadingStateIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      interval = setInterval(() => {
        setLoadingStateIndex((prev) => (prev + 1) % LOADING_STATES.length);
      }, 2500);
    } else {
      setLoadingStateIndex(0);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || prompt.length < 5) {
      setErrorMsg("Please enter at least a short description.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      const result = await generateFormWithAI(prompt.trim());
      router.push(`/forms/${result.form_id}/edit`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate form. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-in rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Wand2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-medium text-card-foreground">Draft with AI</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              What kind of form do you want to build?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setErrorMsg("");
              }}
              placeholder="e.g. A post-event feedback survey for a tech conference asking about speaker quality, catering, and suggestions for next year."
              className="w-full min-h-[120px] resize-none rounded-md border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              autoFocus
              disabled={isSubmitting}
            />
            {errorMsg && (
              <p className="mt-2 text-sm text-destructive">{errorMsg}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isSubmitting ? (
                <span className="flex items-center gap-2 animate-pulse">
                   <Loader2 className="h-4 w-4 animate-spin text-primary" />
                   {LOADING_STATES[loadingStateIndex]}
                </span>
              ) : (
                "AI generation usually takes 5-10 seconds."
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isSubmitting}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Generate
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
