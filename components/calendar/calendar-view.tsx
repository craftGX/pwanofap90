"use client";

import { STATIC_DAYS } from "@/lib/utils";
import { cn } from "@/lib/utils"; // tu peux définir cn si besoin

type Props = {
  selectedDate: string | null;
  onSelect(date: string): void;
};

export function CalendarView({ selectedDate, onSelect }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {STATIC_DAYS.map((d) => (
        <button
          key={d.date}
          onClick={() => onSelect(d.date)}
          className={cn(
            "rounded-md border px-2 py-1 text-sm",
            selectedDate === d.date
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-slate-900/60 text-slate-100 border-slate-700 hover:bg-slate-800",
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
