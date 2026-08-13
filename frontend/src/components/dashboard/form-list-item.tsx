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

interface FormListItemProps {
  form: FormSummary;
  onUpdate: () => void;
}

export function FormListItem({ form, onUpdate }: FormListItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const isPublished = form.status === "published";
  const publicUrl = form.public_slug 
    ? `${window.location.origin}/f/${form.public_slug}`
    : null;

  const handleCopyLink = async () => {
    if (publicUrl) {
      await navigator.clipboard.writeText(publicUrl);
      alert("Link copied to clipboard!");
      setIsMenuOpen(false);
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
    setIsMenuOpen(false);
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
    setIsMenuOpen(false);
  };

  return (
    <div className="group relative flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm border border-gray-100 transition-shadow hover:shadow-md hover:border-gray-200">
      <div className="flex w-[40%] items-center gap-4">
        <Link href={`/forms/${form.id}/edit`} className="block truncate">
          <h3 className="text-sm font-medium text-[#262627] group-hover:text-[#a25fba] transition-colors truncate">
            {form.title}
          </h3>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-between text-sm text-gray-500">
        <div className="w-20 text-center">
          {form.response_count > 0 ? form.response_count : "-"}
        </div>
        <div className="w-24 text-center">
          {/* We don't have completed count directly on FormSummary, using response count for now */}
          {form.response_count > 0 ? form.response_count : "-"}
        </div>
        <div className="w-32 text-center text-xs">
          {new Date(form.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <div className="w-24 flex justify-center text-gray-400">
          <Blocks className="h-4 w-4" />
        </div>
        
        <div className="relative w-12 flex justify-end">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-48 rounded-md border border-gray-200 bg-white shadow-lg py-1 text-left">
                <Link 
                  href={`/forms/${form.id}/edit`}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </Link>
                <Link 
                  href={`/forms/${form.id}/results`}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <BarChart2 className="h-4 w-4" /> Results
                </Link>
                
                {isPublished && (
                  <button 
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" /> Copy link
                  </button>
                )}

                <div className="my-1 border-t border-gray-100" />
                
                <button 
                  onClick={handleTogglePublish}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Globe className="h-4 w-4" /> 
                  {isPublished ? "Unpublish" : "Publish"}
                </button>
                <button 
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Files className="h-4 w-4" /> Duplicate
                </button>
                
                <div className="my-1 border-t border-gray-100" />
                
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
