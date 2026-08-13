"use client";

import React, { useState } from "react";
import { Question, QuestionType } from "@/lib/types";
import { AddContentModal } from "./add-content-modal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Trash2,
  GripVertical,
  Plus,
  Type,
  AlignLeft,
  List,
  ChevronDown,
  Mail,
  Hash,
  ToggleLeft,
  Star,
  FileText,
  Phone,
  Globe,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface QuestionListProps {
  questions: Question[];
  formSettings: Record<string, unknown>;
  activeQuestionId: number | "welcome" | "thank_you" | null;
  onSelect: (id: number | "welcome" | "thank_you") => void;
  onAdd: (type: QuestionType) => void;
  onDelete: (id: number) => void;
  onReorder: (orderedIds: number[]) => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
}

const QUESTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  short_text: <Type className="h-4 w-4" />,
  long_text: <AlignLeft className="h-4 w-4" />,
  multiple_choice: <List className="h-4 w-4" />,
  dropdown: <ChevronDown className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  yes_no: <ToggleLeft className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
  phone_number: <Phone className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  statement: <MessageSquare className="h-4 w-4" />,
};

function SortableQuestionItem({
  question,
  isActive,
  onSelect,
  onDelete,
  index,
}: {
  question: Question;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2 rounded-lg p-2 transition-colors ${
        isActive ? "bg-muted" : "hover:bg-muted/70"
      } ${isDragging ? "bg-card opacity-50 shadow-md" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <button
        onClick={onSelect}
        className="flex flex-1 items-center gap-3 overflow-hidden text-left"
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
          {index + 1}
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          {QUESTION_TYPE_ICONS[question.type]}
        </div>
        <span className="truncate text-sm font-medium text-card-foreground">
          {question.title || "Untitled Question"}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950"
        title="Delete Question"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function QuestionList({
  questions,
  formSettings,
  activeQuestionId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
  onUpdateSettings,
}: QuestionListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const reordered = arrayMove(questions, oldIndex, newIndex);
      onReorder(reordered.map((q) => q.id));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-sm font-medium text-card-foreground">Content</h2>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-all duration-300 ease-in-out hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col">
        {/* Welcome Screen Static Block */}
        {!formSettings?.skip_welcome_screen && (
          <button
            onClick={() => onSelect("welcome")}
            className={`group mb-4 relative flex items-center gap-3 rounded-lg p-2 text-left transition-colors ${
              activeQuestionId === "welcome" ? "bg-muted" : "hover:bg-muted/70"
            }`}
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <span className="flex-1 text-sm font-medium text-card-foreground">Welcome Screen</span>
            
            <div
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ ...formSettings, skip_welcome_screen: true });
                if (activeQuestionId === "welcome") {
                  onSelect(questions.length > 0 ? questions[0].id : "thank_you");
                }
              }}
              className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950"
              title="Delete Welcome Screen"
            >
              <Trash2 className="h-4 w-4" />
            </div>
          </button>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1">
              {questions.map((question, index) => (
                <SortableQuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  isActive={question.id === activeQuestionId}
                  onSelect={() => onSelect(question.id)}
                  onDelete={() => onDelete(question.id)}
                />
              ))}
              {questions.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No questions yet. Click Add to start.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      
      <AddContentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={(type) => {
          if (type === "welcome") {
            onUpdateSettings({ ...formSettings, skip_welcome_screen: false });
            onSelect("welcome");
          } else if (type === "thank_you") {
            onSelect("thank_you");
          } else {
            onAdd(type);
          }
        }} 
      />
    </div>
  );
}
