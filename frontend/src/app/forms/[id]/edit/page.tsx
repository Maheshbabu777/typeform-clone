"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PublicForm, QuestionType, QuestionUpdatePayload } from "@/lib/types";
import { getForm, updateForm, publishForm, unpublishForm, createQuestion, updateQuestion, deleteQuestion, reorderQuestions } from "@/lib/api-creator";
import { ThemeProvider } from "@/components/respondent/theme-provider";
import { QuestionRenderer } from "@/components/respondent/question-renderer";
import { QuestionList } from "@/components/builder/question-list";
import { QuestionEditor } from "@/components/builder/question-editor";
import { WelcomeEditor } from "@/components/builder/welcome-editor";
import { ThankYouEditor } from "@/components/builder/thank-you-editor";
import { ThemeSettings } from "@/components/builder/theme-settings";
import { Link as LinkIcon, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = parseInt(params.id as string, 10);

  const [form, setForm] = useState<PublicForm | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | "welcome" | "thank_you" | null>("welcome");
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const loadForm = useCallback(async () => {
    try {
      const data = await getForm(formId);
      setForm(data);
      setActiveQuestionId((current) => current ?? "welcome");
    } catch (error) {
      console.error("Failed to load form:", error);
      // Fallback to dashboard if not found
      router.push("/");
    }
  }, [formId, router]);

  useEffect(() => {
    if (isNaN(formId)) {
      router.push("/");
      return;
    }
    loadForm();
  }, [formId, loadForm, router]);

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--rx-answer)] border-t-transparent" />
      </div>
    );
  }

  const activeQuestion = form.questions.find((q) => q.id === activeQuestionId) || null;
  const isPublished = form.status === "published";

  const handleTitleChange = async (newTitle: string) => {
    setForm({ ...form, title: newTitle });
    // In a real app, we'd debounce this
    await updateForm(form.id, { title: newTitle });
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      if (isPublished) {
        await unpublishForm(form.id);
        setForm({ ...form, status: "draft" });
      } else {
        const res = await publishForm(form.id);
        setForm({ ...form, status: "published", public_slug: res.public_slug });
      }
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateQuestion = async (type: QuestionType) => {
    try {
      const isChoice = ["multiple_choice", "dropdown"].includes(type);
      const newQ = await createQuestion(form.id, {
        type,
        title: "New Question",
        ...(isChoice ? { options: ["Option 1", "Option 2"] } : {}),
      });
      setForm({
        ...form,
        questions: [...form.questions, newQ],
      });
      setActiveQuestionId(newQ.id);
    } catch (error) {
      console.error("Failed to create question:", error);
    }
  };

  const handleUpdateQuestion = async (id: number, updates: QuestionUpdatePayload) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      };
    });
    try {
      await updateQuestion(id, updates);
    } catch (error) {
      console.error("Failed to update question:", error);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id),
      };
    });
    if (activeQuestionId === id) {
      setActiveQuestionId(null);
    }
    try {
      await deleteQuestion(id);
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  const handleReorder = async (orderedIds: number[]) => {
    const newQuestions = orderedIds
      .map((id) => form.questions.find((q) => q.id === id)!)
      .filter(Boolean);
    
    setForm({ ...form, questions: newQuestions });
    try {
      await reorderQuestions(form.id, orderedIds);
    } catch (error) {
      console.error("Failed to reorder questions:", error);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      {/* Top Bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 text-card-foreground shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="text-sm font-medium text-muted-foreground transition-all duration-300 ease-in-out hover:text-primary"
          >
            ← Dashboard
          </button>
          <div className="h-4 w-[1px] bg-border" />
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="border-none bg-transparent text-lg font-semibold text-foreground transition-colors duration-300 focus:outline-none focus:ring-0"
            placeholder="Form Title"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsThemeOpen(true)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-muted"
          >
            Theme
          </button>
          
          {!isPublished ? (
            <button
              onClick={handlePublishToggle}
              disabled={isPublishing}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-all duration-300 ease-in-out hover:bg-primary/90 disabled:opacity-50"
            >
              Publish
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/f/${form.public_slug}`);
                  setHasCopied(true);
                  setTimeout(() => setHasCopied(false), 2000);
                }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Copy link"
              >
                {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                   setIsPublishing(true);
                   setTimeout(() => setIsPublishing(false), 800);
                }}
                disabled={isPublishing}
                className="rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-all duration-300 ease-in-out hover:opacity-90 disabled:opacity-50"
              >
                {isPublishing ? "Publishing..." : "Publish edits"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Builder Area */}
      <div className="flex flex-1 overflow-x-auto overflow-y-hidden no-scrollbar">
        <div className="flex flex-1 min-w-[1024px] h-full">
          {/* Left Rail (Question List) */}
          <div className="w-[280px] flex-shrink-0 overflow-y-auto border-r border-border bg-card">
            <QuestionList 
              questions={form.questions}
              formSettings={form.settings}
              activeQuestionId={activeQuestionId}
              onSelect={setActiveQuestionId}
              onAdd={handleCreateQuestion}
              onDelete={handleDeleteQuestion}
              onReorder={handleReorder}
              onUpdateSettings={(settings) => {
                setForm({ ...form, settings });
                updateForm(form.id, { settings });
              }}
            />
          </div>

          {/* Center Pane (Editor) */}
          <div className="z-10 flex w-[350px] flex-shrink-0 flex-col overflow-y-auto border-r border-border bg-card shadow-sm">
            {activeQuestionId === "welcome" ? (
              <WelcomeEditor form={form} onChange={(updates) => {
                setForm({ ...form, ...updates });
                updateForm(form.id, updates);
              }} />
            ) : activeQuestionId === "thank_you" ? (
              <ThankYouEditor form={form} onChange={(updates) => {
                setForm({ ...form, ...updates });
                updateForm(form.id, updates);
              }} />
            ) : activeQuestion ? (
              <QuestionEditor 
                form={form}
                question={activeQuestion}
                onChange={(updates) => handleUpdateQuestion(activeQuestion.id, updates)}
                onFormChange={setForm}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                <p>Select a question to edit, or add a new one.</p>
              </div>
            )}
          </div>

          {/* Right Pane (Live Preview) */}
          <div className="relative flex flex-1 items-center justify-center overflow-x-hidden overflow-y-auto bg-background p-4 lg:p-8">
            <div className="w-full max-w-4xl h-full bg-white shadow-xl rounded-2xl overflow-hidden relative flex flex-col rx-theme">
              <ThemeProvider form={form}>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                  {activeQuestionId === "welcome" ? (
                    <div className="flex h-full items-center justify-center flex-col gap-4 text-center">
                      <h1 
                        className="text-[length:var(--rx-font-question-title)] font-normal"
                        style={{ color: "var(--rx-question)" }}
                      >
                        {(form.settings?.welcome_title as string) || form.title}
                      </h1>
                      {(form.settings?.welcome_description || form.description) && (
                        <p 
                          className="text-[length:var(--rx-font-description)]"
                          style={{ color: "var(--rx-question)", opacity: 0.8 }}
                        >
                          {(form.settings?.welcome_description as string) || form.description}
                        </p>
                      )}
                      <button
                        className="px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out mt-4 rounded-[var(--rx-radius)] hover:opacity-90"
                        style={{
                          backgroundColor: "var(--rx-button)",
                          color: "var(--rx-button-content)",
                        }}
                      >
                        Start
                      </button>
                    </div>
                  ) : activeQuestionId === "thank_you" ? (
                    <div className="flex h-full items-center justify-center flex-col gap-4 text-center">
                      <h1 
                        className="text-[length:var(--rx-font-question-title)] font-normal"
                        style={{ color: "var(--rx-question)" }}
                      >
                        {form.thank_you_text || "Thanks for completing this form"}
                      </h1>
                    </div>
                  ) : activeQuestion ? (
                    <QuestionRenderer
                      question={activeQuestion}
                      questionNumber={form.questions.findIndex((q) => q.id === activeQuestion.id) + 1}
                      value={""}
                      error={null}
                      onChange={() => {}}
                      onSubmit={() => {}}
                      isSubmitting={false}
                      showOkButton={true}
                    />
                  ) : null}
                </div>
              </ThemeProvider>
            </div>
          </div>
        </div>
      </div>
      
      {/* Theme Settings Modal */}
      {isThemeOpen && (
        <ThemeSettings 
          form={form} 
          onClose={() => setIsThemeOpen(false)} 
          onUpdate={(updates) => {
            setForm({ ...form, ...updates });
            updateForm(form.id, updates);
          }}
        />
      )}
    </div>
  );
}
