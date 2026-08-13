"use client";

import React, { useState, useEffect } from "react";
import { PublicForm } from "@/lib/types";

interface WelcomeEditorProps {
  form: PublicForm;
  onChange: (updates: Partial<PublicForm>) => void;
}

export function WelcomeEditor({ form, onChange }: WelcomeEditorProps) {
  const defaultTitle = (form.settings?.welcome_title as string) || form.title;
  const defaultDesc = (form.settings?.welcome_description as string) || form.description || "";
  
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDesc);

  useEffect(() => {
    setTitle((form.settings?.welcome_title as string) || form.title);
    setDescription((form.settings?.welcome_description as string) || form.description || "");
  }, [form.id, form.title, form.description, form.settings]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const proposedTitle = title || "Welcome";
      const proposedDesc = description || undefined;
      
      const currentTitle = (form.settings?.welcome_title as string) || form.title;
      const currentDesc = (form.settings?.welcome_description as string) || form.description || undefined;
      
      if (proposedTitle !== currentTitle || proposedDesc !== currentDesc) {
        onChange({ 
          settings: {
            ...form.settings,
            welcome_title: proposedTitle,
            welcome_description: proposedDesc
          }
        });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [title, description, form.title, form.description, form.settings, onChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-medium text-card-foreground">Welcome Screen</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Welcome to our form!"
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
              placeholder="Takes X minutes to complete..."
              rows={3}
            />
          </div>
          
          <div className="border-t border-border pt-4">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Button Text
            </label>
            <input
              type="text"
              value="Start"
              disabled
              className="w-full cursor-not-allowed rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">Custom button text coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
