import React from "react";
import { Lock } from "lucide-react";

interface ComingSoonPanelProps {
  title: string;
  description: string;
}

export function ComingSoonPanel({ title, description }: ComingSoonPanelProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center p-8">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7f7f8] shadow-sm">
        <Lock className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-[#3c323e]">{title}</h2>
      <p className="max-w-md text-gray-500">{description}</p>
      
      <button className="mt-8 rounded-full bg-gray-100 px-6 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
        Coming Soon
      </button>
    </div>
  );
}
