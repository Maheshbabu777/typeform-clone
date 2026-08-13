"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FormSummary } from "@/lib/types";
import { duplicateForm, deleteForm, publishForm, unpublishForm } from "@/lib/api-creator";
import { 
  MoreVertical, 
  Edit3, 
  BarChart2, 
  Copy, 
  Globe, 
  Trash2,
  Files
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameFormModal } from "./rename-form-modal";
import { DeleteFormModal } from "./delete-form-modal";

interface FormCardProps {
  form: FormSummary;
  onUpdate: () => void;
}

export function FormCard({ form, onUpdate }: FormCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
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
    <div className="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Link href={`/forms/${form.id}/edit`} className="block w-full">
            <h3 className="truncate pr-8 text-lg font-medium text-card-foreground transition-colors group-hover:text-primary">
              {form.title}
            </h3>
          </Link>
          
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute right-0 top-0 rounded-md p-1.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
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
                  disabled={isDeleteDialogOpen}
                  className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isPublished
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          }`}>
            {isPublished ? "Published" : "Draft"}
          </span>
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            {form.response_count} {form.response_count === 1 ? "response" : "responses"}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
        Updated {new Date(form.updated_at).toLocaleDateString()}
      </div>

      <RenameFormModal 
        isOpen={isRenaming}
        onClose={() => setIsRenaming(false)}
        form={form}
        onSuccess={onUpdate}
      />
      <DeleteFormModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        form={form}
        onSuccess={onUpdate}
      />
    </div>
  );
}
