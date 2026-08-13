import React, { useMemo, useState } from "react";
import { PublicForm, Question, LogicRule } from "@/lib/types";
import { createLogicRule, updateLogicRule, deleteLogicRule } from "@/lib/api-creator";
import { GitBranch, Loader2, Plus, Trash2, ArrowRight, CornerDownRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogicJumpEditorProps {
  form: PublicForm;
  question: Question;
  onFormChange: (form: PublicForm) => void;
}

export function LogicJumpEditor({ form, question, onFormChange }: LogicJumpEditorProps) {
  const [pendingRuleId, setPendingRuleId] = useState<number | "new" | null>(null);
  const rules = (form.logic || []).filter((r) => r.source_question_id === question.id);
  const sortedQuestions = useMemo(
    () => [...form.questions].sort((a, b) => a.order_index - b.order_index),
    [form.questions],
  );
  const availableTargets = sortedQuestions.filter((q) => q.order_index > question.order_index);
  const conditionLabel = getConditionLabel(question);
  const canUseLogic = question.type !== "statement" && availableTargets.length > 0;

  const handleAddRule = async () => {
    // Determine default condition based on question type
    let defaultCondition = "";
    if (question.type === "multiple_choice" || question.type === "dropdown") {
      defaultCondition = question.options?.[0] || "";
    } else if (question.type === "yes_no") {
      defaultCondition = "Yes";
    } else if (question.type === "rating") {
      defaultCondition = "5";
    }

    if (!defaultCondition) return;

    try {
      setPendingRuleId("new");
      const newRule = await createLogicRule(form.id, {
        question_id: question.id,
        condition_value: defaultCondition,
        target_question_id: availableTargets[0]?.id ?? null,
      });
      onFormChange({
        ...form,
        logic: [...(form.logic || []), newRule],
      });
    } catch (err) {
      console.error("Failed to create logic rule", err);
    } finally {
      setPendingRuleId(null);
    }
  };

  const handleUpdateRule = async (ruleId: number, field: "condition_value" | "target_question_id", value: string | number | null) => {
    const previousLogic = form.logic;
    const updatedLogic = form.logic.map((r) => {
      if (r.id === ruleId) {
        return { ...r, [field]: value };
      }
      return r;
    });
    onFormChange({ ...form, logic: updatedLogic });

    try {
      setPendingRuleId(ruleId);
      await updateLogicRule(ruleId, { [field]: value });
    } catch (err) {
      console.error("Failed to update logic rule", err);
      onFormChange({ ...form, logic: previousLogic });
    } finally {
      setPendingRuleId(null);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    const previousLogic = form.logic;
    const updatedLogic = form.logic.filter((r) => r.id !== ruleId);
    onFormChange({ ...form, logic: updatedLogic });

    try {
      setPendingRuleId(ruleId);
      await deleteLogicRule(ruleId);
    } catch (err) {
      console.error("Failed to delete logic rule", err);
      onFormChange({ ...form, logic: previousLogic });
    } finally {
      setPendingRuleId(null);
    }
  };

  // Helper to render condition input based on question type
  const renderConditionInput = (rule: LogicRule) => {
    if (question.type === "multiple_choice" || question.type === "dropdown") {
      return (
        <Select
          value={rule.condition_value}
          onValueChange={(val) => handleUpdateRule(rule.id, "condition_value", val)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((opt, idx) => (
              <SelectItem key={idx} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    } else if (question.type === "yes_no") {
      return (
        <Select
          value={rule.condition_value}
          onValueChange={(val) => handleUpdateRule(rule.id, "condition_value", val)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Yes or No" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      );
    } else if (question.type === "rating") {
      const max = parseInt((question.settings?.max as string) || "5", 10);
      const options = Array.from({ length: max }, (_, i) => i + 1);
      return (
        <Select
          value={rule.condition_value}
          onValueChange={(val) => handleUpdateRule(rule.id, "condition_value", val)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a rating" />
          </SelectTrigger>
          <SelectContent>
            {options.map((n) => (
              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={rule.condition_value}
        onChange={(e) => handleUpdateRule(rule.id, "condition_value", e.target.value)}
        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent shadow-sm px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Type matching answer"
      />
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <GitBranch className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-card-foreground">Logic jumps</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Send people to a later question, or straight to the ending, when this answer matches.
          </p>
        </div>
      </div>

      {rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="overflow-hidden rounded-lg border border-border bg-card text-sm shadow-sm">
              <div className="border-b border-border bg-background/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <CornerDownRight className="h-3.5 w-3.5" />
                    Rule
                  </div>
                  {pendingRuleId === rule.id && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{conditionLabel}</span>
                  <div className="flex items-center gap-2">
                    {renderConditionInput(rule)}
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={pendingRuleId === rule.id}
                      className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
                      title="Delete logic jump"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Then jump to</span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                    <Select
                      value={rule.target_question_id ? rule.target_question_id.toString() : "end"}
                      onValueChange={(val) => {
                        const targetId = val === "end" ? null : parseInt(val, 10);
                        handleUpdateRule(rule.id, "target_question_id", targetId);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a question" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="end">End screen</SelectItem>
                        {availableTargets.map((q) => (
                          <SelectItem key={q.id} value={q.id.toString()}>
                            Q{q.order_index + 1}: {q.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border bg-background/70 p-4">
          <p className="text-sm font-medium text-card-foreground">No rules yet</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Everyone currently continues to the next question.
          </p>
        </div>
      )}

      {canUseLogic ? (
        <button
          onClick={handleAddRule}
          disabled={pendingRuleId !== null}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingRuleId === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add rule
        </button>
      ) : (
        <p className="rounded-md bg-background/70 px-3 py-2 text-center text-xs italic text-muted-foreground">
          {question.type === "statement"
            ? "Statements do not collect answers, so they cannot branch."
            : "Add a later question before creating a jump from here."}
        </p>
      )}
    </div>
  );
}

function getConditionLabel(question: Question) {
  if (question.type === "multiple_choice" || question.type === "dropdown") {
    return "When selected option is";
  }
  if (question.type === "yes_no") {
    return "When answer is";
  }
  if (question.type === "rating") {
    return "When rating equals";
  }
  return "When answer exactly matches";
}
