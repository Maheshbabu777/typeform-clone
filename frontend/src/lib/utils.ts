import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseUTCDate(dateString: string): Date {
  if (!dateString) return new Date();
  if (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(dateString);
  }
  return new Date(dateString.replace(' ', 'T') + 'Z');
}

export function formatIndianDateTime(dateString: string | null): string {
  if (!dateString) return "";
  const d = parseUTCDate(dateString);
  return d.toLocaleString("en-IN", { 
    timeZone: "Asia/Kolkata", 
    day: "2-digit", 
    month: "short", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

export function formatIndianDate(dateString: string | null): string {
  if (!dateString) return "";
  const d = parseUTCDate(dateString);
  return d.toLocaleDateString("en-IN", { 
    timeZone: "Asia/Kolkata", 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });
}
