"use client";

import React, { useState } from "react";
import { Question } from "@/lib/types";
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
  MoreVertical,
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
  CreditCard,
  Upload,
} from "lucide-react";

interface QuestionListProps {
  questions: Question[];
  activeQuestionId: number | null;
  onSelect: (id: number) => void;
  onAdd: (type: string) => void;
  onDelete: (id: number) => void;
  onReorder: (orderedIds: number[]) => void;
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
};

const ADD_MENU_ITEMS = [
  { type: "short_text", label: "Short Text", icon: QUESTION_TYPE_ICONS.short_text },
  { type: "long_text", label: "Long Text", icon: QUESTION_TYPE_ICONS.long_text },
  { type: "multiple_choice", label: "Multiple Choice", icon: QUESTION_TYPE_ICONS.multiple_choice },
  { type: "dropdown", label: "Dropdown", icon: QUESTION_TYPE_ICONS.dropdown },
  { type: "email", label: "Email", icon: QUESTION_TYPE_ICONS.email },
  { type: "number", label: "Number", icon: QUESTION_TYPE_ICONS.number },
  { type: "yes_no", label: "Yes/No", icon: QUESTION_TYPE_ICONS.yes_no },
  { type: "rating", label: "Rating", icon: QUESTION_TYPE_ICONS.rating },
  { type: "payment", label: "Payment", icon: <CreditCard className="h-4 w-4" />, disabled: true, badge: "Coming Soon" },
  { type: "file_upload", label: "File Upload", icon: <Upload className="h-4 w-4" />, disabled: true, badge: "Coming Soon" },
];

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
        isActive ? "bg-gray-100" : "hover:bg-gray-50"
      } ${isDragging ? "opacity-50 shadow-md bg-white" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <button
        onClick={onSelect}
        className="flex flex-1 items-center gap-3 overflow-hidden text-left"
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-200 text-xs font-medium text-gray-600">
          {index + 1}
        </div>
        <div className="flex-shrink-0 text-gray-500">
          {QUESTION_TYPE_ICONS[question.type]}
        </div>
        <span className="truncate text-sm font-medium text-[#3c323e]">
          {question.title || "Untitled Question"}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex-shrink-0 rounded p-1 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        title="Delete Question"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function QuestionList({
  questions,
  activeQuestionId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
}: QuestionListProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

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
      <div className="p-4 flex items-center justify-between border-b border-[#dedcde]">
        <h2 className="text-sm font-semibold text-[#3c323e]">Content</h2>
        
        <div className="relative">
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="flex items-center gap-1 rounded bg-[#a25fba] px-2 py-1 text-xs font-medium text-white hover:bg-[#9454ab] transition-all duration-300 ease-in-out"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
          
          {isAddMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-md border border-[#dedcde] bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-200">
              {ADD_MENU_ITEMS.map((item) => (
                <button
                  key={item.type}
                  disabled={item.disabled}
                  onClick={() => {
                    onAdd(item.type);
                    setIsAddMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${
                    item.disabled
                      ? "cursor-not-allowed text-gray-400"
                      : "text-[#3c323e] hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
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
                <div className="p-4 text-center text-sm text-gray-500">
                  No questions yet. Click Add to start.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      
      {/* Click outside listener for the menu could be added here, but leaving simple for now */}
      {isAddMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsAddMenuOpen(false)}
        />
      )}
    </div>
  );
}
