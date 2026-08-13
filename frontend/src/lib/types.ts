export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export type ThemeRoundness = "none" | "small" | "large";
export type ThemeFontSize = "small" | "medium" | "large";

export interface ThemeColors {
  answer: string;
  background: string;
  button: string;
  question: string;
  button_content: string;
}

export interface Question {
  id: number;
  form_id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  order_index: number;
  options: string[];
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LogicRule {
  id: number;
  form_id: number;
  source_question_id: number;
  operator: string;
  condition_value: string;
  target_question_id: number | null;
}

export interface PublicForm {
  id: number;
  creator_id: number;
  title: string;
  description: string;
  status: string;
  public_slug: string | null;
  theme_id: string | null;
  theme_colors: ThemeColors;
  theme_roundness: ThemeRoundness;
  theme_font_size: ThemeFontSize;
  thank_you_text: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  questions: Question[];
  logic: LogicRule[];
}

export interface PublicAnswerPayload {
  question_id: number;
  value: string;
}

export interface PublicSubmitPayload {
  response_id?: number;
  answers: PublicAnswerPayload[];
}

export interface FormUpdatePayload {
  title?: string;
  description?: string;
  theme_colors?: Partial<ThemeColors>;
  theme_roundness?: ThemeRoundness;
  theme_font_size?: ThemeFontSize;
  thank_you_text?: string;
}

export interface QuestionCreatePayload {
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  options?: string[];
  settings?: Record<string, unknown>;
}

export interface QuestionUpdatePayload {
  type?: QuestionType;
  title?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  settings?: Record<string, unknown>;
}

export interface LogicRuleCreatePayload {
  question_id: number;
  condition_value: string;
  target_question_id: number | null;
}
