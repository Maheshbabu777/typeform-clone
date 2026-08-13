"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getForm, listFormResponses, getFormStats, getCsvExportUrl } from "@/lib/api-creator";
import { PublicForm, ResponseSummary, QuestionStats } from "@/lib/types";
import { SummaryView } from "@/components/results/summary-view";
import { ResponsesTable } from "@/components/results/responses-table";
import { ArrowLeft, Download, BarChart2, Table as TableIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type Tab = "summary" | "responses";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = parseInt(params.id as string, 10);

  const [form, setForm] = useState<PublicForm | null>(null);
  const [responses, setResponses] = useState<ResponseSummary[]>([]);
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  useEffect(() => {
    async function fetchData() {
      if (isNaN(formId)) return;
      try {
        const [formData, responsesData, statsData] = await Promise.all([
          getForm(formId),
          listFormResponses(formId),
          getFormStats(formId),
        ]);
        setForm(formData);
        setResponses(responsesData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load results data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [formId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h2 className="text-xl font-semibold text-foreground">Form not found</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-primary hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 text-card-foreground shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <div className="h-4 w-px bg-border" />
          <h1 className="max-w-sm truncate text-lg font-medium text-foreground">
            {form.title}
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Results
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <a
            href={getCsvExportUrl(formId)}
            download
            className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "summary"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab("responses")}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "responses"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <TableIcon className="h-4 w-4" />
            Responses
          </button>
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          {activeTab === "summary" ? (
            <SummaryView form={form} responses={responses} stats={stats} />
          ) : (
            <ResponsesTable form={form} responses={responses} />
          )}
        </div>
      </main>
    </div>
  );
}
