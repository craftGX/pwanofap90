"use client";

import type { HealthEntry } from "@/lib/utils";

type Props = {
  entries: HealthEntry[];
  onDelete(date: string): void;
};

export function HistoryList({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">Pas d&apos;entrée pour le moment.</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li
          key={e.date}
          className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm"
        >
          <div>
            <div className="font-medium">{e.date}</div>
            <div className="text-slate-400">Score : {e.score}</div>
            {e.note && <div className="text-xs text-slate-500">Note : {e.note}</div>}
          </div>
          <button
            onClick={() => onDelete(e.date)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  );
}
