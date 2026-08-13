from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, field_validator

QuestionType = Literal[
    "short_text",
    "long_text",
    "multiple_choice",
    "dropdown",
    "email",
    "number",
    "yes_no",
    "rating",
    "phone_number",
    "website",
    "date",
    "statement",
]


class FormCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)


class FormUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    theme_colors: dict[str, str] | None = None
    theme_roundness: Literal["none", "small", "large"] | None = None
    theme_font_size: Literal["small", "medium", "large"] | None = None
    thank_you_text: str | None = None
    settings: dict[str, Any] | None = None


class QuestionCreate(BaseModel):
    type: QuestionType
    title: str = Field(min_length=1, max_length=240)
    description: str | None = None
    required: bool = False
    options: list[str] | None = None
    settings: dict[str, Any] | None = None

    @field_validator("options")
    @classmethod
    def clean_options(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        cleaned = [option.strip() for option in value if option.strip()]
        if not cleaned:
            return None
        return cleaned


class QuestionUpdate(BaseModel):
    type: QuestionType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=240)
    description: str | None = None
    required: bool | None = None
    options: list[str] | None = None
    settings: dict[str, Any] | None = None


class ReorderQuestions(BaseModel):
    ordered_ids: list[int] = Field(min_length=1)


class LogicRuleCreate(BaseModel):
    source_question_id: int = Field(
        validation_alias=AliasChoices("source_question_id", "question_id")
    )
    condition_value: str = Field(min_length=1)
    target_question_id: int | None = None


class LogicRuleUpdate(BaseModel):
    condition_value: str | None = Field(default=None, min_length=1)
    target_question_id: int | None = None


class PublicAnswer(BaseModel):
    question_id: int
    value: str


class PublicSubmit(BaseModel):
    response_id: int | None = None
    answers: list[PublicAnswer]


class EmailCheck(BaseModel):
    email: EmailStr

    model_config = ConfigDict(extra="forbid")
