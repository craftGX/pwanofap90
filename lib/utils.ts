export type HealthEntry = {
  date: string; // format "YYYY-MM-DD"
  score: number;
  note?: string;
};

const STORAGE_KEY = "health-entries";

export function loadEntries(): HealthEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HealthEntry[];
  } catch {
    return [];
  }
}

export function saveEntries(entries: HealthEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Dates en dur pour le calendrier (pas de toISOString)
export const STATIC_DAYS: { date: string; label: string }[] = [
  { date: "2026-03-20", label: "20 Mar" },
  { date: "2026-03-21", label: "21 Mar" },
  { date: "2026-03-22", label: "22 Mar" },
  { date: "2026-03-23", label: "23 Mar" },
  { date: "2026-03-24", label: "24 Mar" },
];

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
