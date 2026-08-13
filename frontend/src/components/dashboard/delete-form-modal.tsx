"use client";

import React, { useState } from "react";
import { deleteForm } from "@/lib/api-creator";
import { Loader2, AlertTriangle } from "lucide-react";
import type { FormSummary } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormSummary;
  onSuccess: () => void;
}

export function DeleteFormModal({ isOpen, onClose, form, onSuccess }: DeleteFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteForm(form.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
            Delete form
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{form.title}"</span>?
            <br /><br />
            This action cannot be undone. All questions, logic rules, and respondent data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 sm:justify-end gap-2 sm:gap-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
