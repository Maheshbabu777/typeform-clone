"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FormSummary } from "@/lib/types";
import { duplicateForm, deleteForm, publishForm, unpublishForm } from "@/lib/api-creator";
import { 
  MoreHorizontal, 
  Edit3, 
  BarChart2, 
  Copy, 
  Globe, 
  Trash2,
  Files,
  Blocks
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameFormModal } from "./rename-form-modal";

interface FormListItemProps {
  form: FormSummary;
  onUpdate: () => void;
}

export function FormListItem({ form, onUpdate }: FormListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const isPublished = form.status === "published";
  const publicUrl = form.public_slug 
    ? `${window.location.origin}/f/${form.public_slug}`
    : null;

  const handleCopyLink = async () => {
    if (publicUrl) {
      await navigator.clipboard.writeText(publicUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this form? This cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteForm(form.id);
        onUpdate();
      } catch (err) {
        console.error(err);
        setIsDeleting(false);
      }
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await duplicateForm(form.id);
      onUpdate();
    } catch (err) {
      console.error(err);
      setIsDuplicating(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      if (isPublished) {
        await unpublishForm(form.id);
      } else {
        await publishForm(form.id);
      }
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="group relative flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-card-foreground shadow-sm transition-shadow hover:border-border/80 hover:shadow-md">
      <Link href={`/forms/${form.id}/edit`} className="absolute inset-0 z-0 rounded-lg" aria-label="Edit form" />
      
      <div className="flex w-[40%] items-center gap-4 cursor-pointer relative z-10 pointer-events-none">
        <h3 className="truncate text-sm font-medium text-card-foreground transition-colors group-hover:text-primary">
          {form.title}
        </h3>
      </div>

      <div className="flex flex-1 items-center justify-between text-sm text-muted-foreground">
        <div className="w-20 flex justify-center relative z-10">
          <Link href={`/forms/${form.id}/results`} className="min-w-[2rem] rounded border border-border px-2 py-0.5 text-center transition-colors hover:bg-muted">
            {form.response_count > 0 ? form.response_count : "-"}
          </Link>
        </div>
        <div className="w-24 flex justify-center relative z-10">
          {/* We don't have completed count directly on FormSummary, using response count for now */}
          <Link href={`/forms/${form.id}/results`} className="min-w-[2rem] rounded border border-border px-2 py-0.5 text-center transition-colors hover:bg-muted">
            {form.response_count > 0 ? form.response_count : "-"}
          </Link>
        </div>
        <div className="w-32 text-center text-xs">
          {new Date(form.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <div className="relative z-10 flex w-24 justify-center text-muted-foreground">
          <button 
            onClick={() => toast(`"Integrations" coming soon!`, { description: "This feature is a placeholder and it's coming soon" })}
            className="rounded p-1 outline-none transition-colors hover:bg-muted hover:text-foreground"
          >
            <Blocks className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative w-12 flex justify-end z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/forms/${form.id}/edit`} className="flex w-full cursor-pointer items-center gap-2">
                  <Edit3 className="h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/forms/${form.id}/results`} className="flex w-full cursor-pointer items-center gap-2">
                  <BarChart2 className="h-4 w-4" /> Results
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsRenaming(true)} 
                className="cursor-pointer gap-2"
              >
                <Edit3 className="h-4 w-4" /> Rename
              </DropdownMenuItem>
              
              {isPublished && (
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
                  <Copy className="h-4 w-4" /> Copy link
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleTogglePublish} className="cursor-pointer gap-2">
                <Globe className="h-4 w-4" /> 
                {isPublished ? "Unpublish" : "Publish"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDuplicate} 
                disabled={isDuplicating}
                className="cursor-pointer gap-2"
              >
                <Files className="h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <RenameFormModal 
        isOpen={isRenaming}
        onClose={() => setIsRenaming(false)}
        form={form}
        onSuccess={onUpdate}
      />
    </div>
  );
}
