"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  Type,
  AlignLeft,
  List,
  ChevronDown,
  ToggleLeft,
  Star,
  CreditCard,
  Upload,
  FileText,
  Flag,
  Phone,
  Globe,
  Calendar,
  MessageSquare,
  Mail,
  Hash,
  MapPin
} from "lucide-react";
import { QuestionType } from "@/lib/types";

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: QuestionType | "welcome" | "thank_you") => void;
}

interface ElementOption {
  type: QuestionType | "welcome" | "thank_you" | "payment" | "file_upload" | "address" | "matrix" | "opinion_scale" | "ranking" | "legal";
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  comingSoon?: boolean;
}

const CATEGORIES: { title: string; elements: ElementOption[] }[] = [
  {
    title: "Contact info",
    elements: [
      { type: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
      { type: "phone_number", label: "Phone Number", icon: <Phone className="h-4 w-4" /> },
      { type: "address", label: "Address", icon: <MapPin className="h-4 w-4" />, disabled: true, comingSoon: true },
      { type: "website", label: "Website", icon: <Globe className="h-4 w-4" /> },
    ],
  },
  {
    title: "Choice",
    elements: [
      { type: "multiple_choice", label: "Multiple Choice", icon: <List className="h-4 w-4" /> },
      { type: "dropdown", label: "Dropdown", icon: <ChevronDown className="h-4 w-4" /> },
      { type: "yes_no", label: "Yes/No", icon: <ToggleLeft className="h-4 w-4" /> },
      { type: "legal", label: "Legal", icon: <FileText className="h-4 w-4" />, disabled: true, comingSoon: true },
    ],
  },
  {
    title: "Rating & ranking",
    elements: [
      { type: "opinion_scale", label: "Opinion Scale", icon: <Star className="h-4 w-4" />, disabled: true, comingSoon: true },
      { type: "rating", label: "Rating", icon: <Star className="h-4 w-4" /> },
      { type: "ranking", label: "Ranking", icon: <List className="h-4 w-4" />, disabled: true, comingSoon: true },
      { type: "matrix", label: "Matrix", icon: <List className="h-4 w-4" />, disabled: true, comingSoon: true },
    ],
  },
  {
    title: "Text & Video",
    elements: [
      { type: "long_text", label: "Long Text", icon: <AlignLeft className="h-4 w-4" /> },
      { type: "short_text", label: "Short Text", icon: <Type className="h-4 w-4" /> },
    ],
  },
  {
    title: "Other",
    elements: [
      { type: "number", label: "Number", icon: <Hash className="h-4 w-4" /> },
      { type: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> },
      { type: "statement", label: "Statement", icon: <MessageSquare className="h-4 w-4" /> },
      { type: "payment", label: "Payment", icon: <CreditCard className="h-4 w-4" />, disabled: true, comingSoon: true },
      { type: "file_upload", label: "File Upload", icon: <Upload className="h-4 w-4" />, disabled: true, comingSoon: true },
      { type: "welcome", label: "Welcome Screen", icon: <FileText className="h-4 w-4" /> },
      { type: "thank_you", label: "End Screen", icon: <Flag className="h-4 w-4" /> },
    ],
  },
];

export function AddContentModal({ isOpen, onClose, onAdd }: AddContentModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const handleAdd = (item: ElementOption) => {
    if (item.disabled) return;
    onAdd(item.type as QuestionType | "welcome" | "thank_you");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      <div className="flex h-full max-h-[800px] w-full max-w-5xl flex-col rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-border px-6">
          <div className="flex gap-6">
            <button className="border-b-2 border-foreground py-4 text-sm font-semibold text-foreground">
              Add form elements
            </button>
            <button className="cursor-not-allowed py-4 text-sm font-medium text-muted-foreground">
              Import questions
            </button>
            <button className="cursor-not-allowed py-4 text-sm font-medium text-muted-foreground">
              Create with AI
            </button>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="flex w-[280px] flex-col gap-6 border-r border-border bg-muted/30 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search form elements"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recommended
              </h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleAdd(CATEGORIES[1].elements[0])}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-left text-sm font-medium text-card-foreground transition-all hover:border-primary hover:text-primary"
                >
                  <List className="h-4 w-4" /> Multiple Choice
                </button>
                <button 
                  onClick={() => handleAdd(CATEGORIES[3].elements[1])}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-left text-sm font-medium text-card-foreground transition-all hover:border-primary hover:text-primary"
                >
                  <Type className="h-4 w-4" /> Short Text
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Connect to apps
              </h3>
              <div className="flex flex-col gap-2 opacity-60">
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded bg-orange-500" /> Hubspot
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded bg-blue-500" /> Salesforce
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2 xl:grid-cols-3">
              {CATEGORIES.map((category) => {
                const filteredElements = category.elements.filter((el) =>
                  el.label.toLowerCase().includes(search.toLowerCase())
                );

                if (filteredElements.length === 0) return null;

                return (
                  <div key={category.title}>
                    <h3 className="mb-4 text-sm font-semibold text-card-foreground">
                      {category.title}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {filteredElements.map((item) => (
                        <button
                          key={item.label}
                          disabled={item.disabled}
                          onClick={() => handleAdd(item)}
                          className={`group flex items-center justify-between rounded-md p-2 text-left text-sm transition-all duration-200 ${
                            item.disabled
                              ? "cursor-not-allowed opacity-50"
                              : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          }`}
                        >
                          <div className="flex items-center gap-3 font-medium">
                            <div className={`flex items-center justify-center rounded p-1.5 ${item.disabled ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                              {item.icon}
                            </div>
                            <span>{item.label}</span>
                          </div>
                          {item.comingSoon && (
                            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Soon</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {search && !CATEGORIES.some(c => c.elements.some(e => e.label.toLowerCase().includes(search.toLowerCase()))) && (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No form elements found matching &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
