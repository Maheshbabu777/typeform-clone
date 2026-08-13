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

interface FormCardProps {
  form: FormSummary;
  onUpdate: () => void;
}

export function FormCard({ form, onUpdate }: FormCardProps) {
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
    <div className="group relative flex flex-col justify-between rounded-lg border border-[#dedcde] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Link href={`/forms/${form.id}/edit`} className="block w-full">
            <h3 className="text-lg font-semibold text-[#3c323e] group-hover:text-[#a25fba] transition-colors truncate pr-8">
              {form.title}
            </h3>
          </Link>
          
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="absolute right-0 top-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-20 w-48 rounded-md border border-gray-200 bg-white shadow-lg py-1">
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

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isPublished ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}>
            {isPublished ? "Published" : "Draft"}
          </span>
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            {form.response_count} {form.response_count === 1 ? "response" : "responses"}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-3 text-xs text-gray-400">
        Updated {new Date(form.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
}
