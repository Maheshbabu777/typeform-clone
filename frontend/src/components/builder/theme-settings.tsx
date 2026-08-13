"use client";

import { PublicForm, ThemeColors, ThemeRoundness, ThemeFontSize } from "@/lib/types";
import { X } from "lucide-react";

interface ThemeSettingsProps {
  form: PublicForm;
  onClose: () => void;
  onUpdate: (updates: Partial<PublicForm>) => void;
}

const COLOR_KEYS: { key: keyof ThemeColors; label: string }[] = [
  { key: "question", label: "Questions" },
  { key: "answer", label: "Answers & Inputs" },
  { key: "button", label: "Buttons" },
  { key: "button_content", label: "Button Text" },
  { key: "background", label: "Background" },
];

export function ThemeSettings({ form, onClose, onUpdate }: ThemeSettingsProps) {
  
  const handleColorChange = (key: keyof ThemeColors, hex: string) => {
    onUpdate({
      theme_colors: {
        ...form.theme_colors,
        [key]: hex,
      },
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[350px] border-l border-[#dedcde] bg-white shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-[#dedcde] p-4">
        <h2 className="text-lg font-semibold text-[#3c323e]">Theme Settings</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Colors */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Colors</h3>
          <div className="space-y-3">
            {COLOR_KEYS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#3c323e]">{label}</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase w-16">{form.theme_colors[key]}</span>
                  <input
                    type="color"
                    value={form.theme_colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-transparent p-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roundness */}
        <div className="space-y-4 pt-4 border-t border-[#dedcde]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Shape</h3>
          <div className="flex gap-2">
            {(["none", "small", "large"] as ThemeRoundness[]).map((r) => (
              <button
                key={r}
                onClick={() => onUpdate({ theme_roundness: r })}
                className={`flex-1 rounded-md border py-2 text-sm capitalize transition-colors ${
                  form.theme_roundness === r
                    ? "border-[#a25fba] bg-[#a25fba]/10 text-[#a25fba] font-medium"
                    : "border-[#dedcde] hover:bg-gray-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-4 pt-4 border-t border-[#dedcde]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Typography</h3>
          <div className="flex gap-2">
            {(["small", "medium", "large"] as ThemeFontSize[]).map((f) => (
              <button
                key={f}
                onClick={() => onUpdate({ theme_font_size: f })}
                className={`flex-1 rounded-md border py-2 text-sm capitalize transition-colors ${
                  form.theme_font_size === f
                    ? "border-[#a25fba] bg-[#a25fba]/10 text-[#a25fba] font-medium"
                    : "border-[#dedcde] hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
