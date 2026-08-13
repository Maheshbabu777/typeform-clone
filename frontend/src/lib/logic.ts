import type { LogicRule, Question } from "@/lib/types";

export function computeVisitedQuestionIds(
  questions: Question[],
  logicRules: LogicRule[],
  answersByQuestion: Record<number, string>,
): number[] {
  if (questions.length === 0) return [];

  const order = questions.map((question) => question.id);
  const indexById = new Map(order.map((id, index) => [id, index]));
  const rulesBySource = new Map<number, LogicRule[]>();

  for (const rule of logicRules) {
    const existing = rulesBySource.get(rule.source_question_id) ?? [];
    existing.push(rule);
    rulesBySource.set(rule.source_question_id, existing);
  }

  const visited: number[] = [];
  let currentIndex = 0;
  let seenSteps = 0;

  while (currentIndex >= 0 && currentIndex < order.length && seenSteps <= order.length) {
    seenSteps += 1;
    const questionId = order[currentIndex];
    visited.push(questionId);

    const answerValue = answersByQuestion[questionId];
    const matchingRule = (rulesBySource.get(questionId) ?? []).find(
      (rule) => answerValue !== undefined && rule.condition_value === answerValue,
    );

    if (matchingRule) {
      const targetId = matchingRule.target_question_id;
      if (targetId === null) break;
      const targetIndex = indexById.get(targetId);
      if (targetIndex === undefined || targetIndex <= currentIndex) break;
      currentIndex = targetIndex;
      continue;
    }

    currentIndex += 1;
  }

  return visited;
}

export function getNextQuestionId(
  currentQuestionId: number,
  questions: Question[],
  logicRules: LogicRule[],
  answersByQuestion: Record<number, string>,
): number | null {
  const visited = computeVisitedQuestionIds(questions, logicRules, answersByQuestion);
  const currentIndex = visited.indexOf(currentQuestionId);
  if (currentIndex === -1) return null;
  return visited[currentIndex + 1] ?? null;
}

export function getProgressValue(
  currentQuestionId: number,
  questions: Question[],
  logicRules: LogicRule[],
  answersByQuestion: Record<number, string>,
): number {
  if (questions.length === 0) return 1;

  const visited = computeVisitedQuestionIds(questions, logicRules, answersByQuestion);
  const currentIndex = visited.indexOf(currentQuestionId);
  if (currentIndex === -1) return 0;

  return (currentIndex + 1) / visited.length;
}
