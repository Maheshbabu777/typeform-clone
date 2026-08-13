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
  FileText,
  Flag,
  Phone,
  Globe,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface QuestionListProps {
  questions: Question[];
  formSettings: any;
  activeQuestionId: number | "welcome" | "thank_you" | null;
  onSelect: (id: number | "welcome" | "thank_you") => void;
  onAdd: (type: QuestionType | "welcome" | "thank_you") => void;
  onDelete: (id: number) => void;
  onReorder: (orderedIds: number[]) => void;
  onUpdateSettings: (settings: any) => void;
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
      <div className="p-4 flex items-center justify-between border-b border-[#dedcde]">
        <h2 className="text-sm font-semibold text-[#3c323e]">Content</h2>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 rounded bg-[#a25fba] px-2 py-1 text-xs font-medium text-white hover:bg-[#9454ab] transition-all duration-300 ease-in-out"
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
              activeQuestionId === "welcome" ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-200 text-xs font-medium text-gray-600">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-[#3c323e] flex-1">Welcome Screen</span>
            
            <div
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ ...formSettings, skip_welcome_screen: true });
                if (activeQuestionId === "welcome") {
                  onSelect(questions.length > 0 ? questions[0].id : "thank_you");
                }
              }}
              className="flex-shrink-0 rounded p-1 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 transition-all duration-200"
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
                <div className="p-4 text-center text-sm text-gray-500">
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
