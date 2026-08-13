"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getForm, listFormResponses, getFormStats, getCsvExportUrl } from "@/lib/api-creator";
import { PublicForm, ResponseSummary, QuestionStats } from "@/lib/types";
import { SummaryView } from "@/components/results/summary-view";
import { ResponsesTable } from "@/components/results/responses-table";
import { ArrowLeft, Download, BarChart2, Table as TableIcon } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3c323e] border-t-transparent" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f8]">
        <h2 className="text-xl font-semibold text-[#3c323e]">Form not found</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-[#a25fba] hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f8]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-[#dedcde] bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#3c323e]"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-[#3c323e] truncate max-w-sm">
            {form.title}
          </h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            Results
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={getCsvExportUrl(formId)}
            download
            className="flex items-center gap-2 rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[#dedcde] bg-white px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "summary"
                ? "border-[#3c323e] text-[#3c323e]"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab("responses")}
            className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "responses"
                ? "border-[#3c323e] text-[#3c323e]"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
