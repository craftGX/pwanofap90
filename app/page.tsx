"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "stop_mastu_days_v2";

type DayEntry = {
  id: string;
  date: string; // "YYYY-MM-DD"
  level: 0 | 1 | 2 | 3;
  note?: string;
  triggers?: string;
  difficulty?: number;
  message?: string;
  createdAt?: string;
};

const successMsgs = [
  "Bravo, tu as dominé ton envie aujourd'hui. Continue, tu construis un vrai caractère.",
  "Excellence aujourd'hui. Un jour de plus loin de cette habitude, un jour de plus vers la maîtrise.",
  "Tu as dit non, et c'est une énorme victoire. Garde ce rythme, tu peux casser ce cycle.",
  "Tu contrôles ton corps, pas l'inverse. Journée réussie, respecte-toi encore plus demain.",
  "Tu viens de prouver que tu es plus fort que ton impulsion. Accumule ces victoires jour après jour.",
  "Aujourd'hui tu as choisi la discipline, pas la facilité. C'est exactement comme ça qu'on devient solide.",
  "Chaque jour où tu résistes, tu affaiblis cette habitude. Continue, elle perd du pouvoir sur toi.",
  "Tu peux être fier de toi, tu as protégé ton énergie et ton honneur aujourd'hui.",
  "Ce refus d'aujourd'hui vaut mille regrets que tu ne connaîtras jamais. Continue dans ce sens.",
  "Tu as protégé ton regard et ton esprit. C'est comme ça qu'on reconstruit une vraie dignité.",
];

const hardMsgs = [
  "Tu viens de céder. Regarde la vérité en face et décide que ça s'arrête ici.",
  "Cette rechute ne te ressemble pas. Tu vaux mieux que ce plaisir instantané.",
  "Tu viens de nourrir une habitude qui te vole ton énergie. Ne normalise jamais ça.",
  "Si tu continues comme ça, tu resteras prisonnier. Utilise cette chute comme électrochoc.",
  "Tu savais que ça ne t'apporterait rien de durable, et tu l'as fait quand même. Ne laisse pas ça devenir normal.",
];

const neutralMsgs = [
  "Journée imparfaite, mais tu as quand même résisté à des moments clés. Analyse ce qui t'a aidé.",
  "Tu as senti la tension aujourd'hui, mais tu n'as pas basculé. Renforce ce qui t'a tenu.",
  "Tu n'as pas été parfait, mais tu ne t'es pas abandonné. Utilise cette expérience pour affiner ta stratégie.",
];

function localDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseInputDate(dateStr: string | null) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function todayString() {
  return localDateString(new Date());
}

function randomItem<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function buildAutoMessage(level: number) {
  if (level === 3) return randomItem(successMsgs);
  if (level === 2 || level === 1) return randomItem(neutralMsgs.concat(successMsgs));
  return randomItem(hardMsgs);
}

export default function HomePage() {
  const [dayDate, setDayDate] = useState<string>("");
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(3);
  const [note, setNote] = useState("");
  const [triggers, setTriggers] = useState("");
  const [difficulty, setDifficulty] = useState<number>(2);
  const [objectiveDays, setObjectiveDays] = useState<number>(30);

  const [days, setDays] = useState<DayEntry[]>([]);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "fail" | "neutral";
    text: string;
  } | null>(null);
  const [motivationText, setMotivationText] = useState("");

  const [miniBestStreak, setMiniBestStreak] = useState(0);
  const [miniMonthClean, setMiniMonthClean] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Confirmation");
  const [modalMessage, setModalMessage] = useState("Confirmer cette action ?");
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DayEntry[];
        setDays(parsed);
      }
    } catch {
      //
    }
    setDayDate(todayString());
    setMotivationText(randomItem(successMsgs.concat(neutralMsgs)));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  }, [days]);

  const sortedDays = useMemo(() => [...days].sort((a, b) => a.date.localeCompare(b.date)), [days]);

  const { goodCount, badCount, streak, bestStreak, ratio30 } = useMemo(() => {
    if (sortedDays.length === 0) {
      setMiniBestStreak(0);
      setMiniMonthClean(0);
      return { goodCount: 0, badCount: 0, streak: 0, bestStreak: 0, ratio30: 0 };
    }

    let good = 0;
    let bad = 0;
    sortedDays.forEach((d) => {
      if (d.level === 3) good++;
      if (d.level === 0) bad++;
    });

    let best = 0;
    let current = 0;
    for (let i = 0; i < sortedDays.length; i++) {
      if (sortedDays[i].level === 3) {
        current++;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }

    let streakNow = 0;
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      if (sortedDays[i].level === 3) streakNow++;
      else break;
    }

    const now = new Date();
    const nowStr = localDateString(now);
    const nowDate = parseInputDate(nowStr)!;
    const thirtyAgo = new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    let cleanLast30 = 0;
    let totalLast30 = 0;
    sortedDays.forEach((d) => {
      const obj = parseInputDate(d.date)!;
      if (obj >= thirtyAgo && obj <= nowDate) {
        totalLast30++;
        if (d.level === 3) cleanLast30++;
      }
    });

    const ratio = totalLast30 === 0 ? 0 : Math.round((cleanLast30 / totalLast30) * 100);

    setMiniBestStreak(best);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let monthClean = 0;
    sortedDays.forEach((d) => {
      const obj = parseInputDate(d.date)!;
      if (obj.getFullYear() === currentYear && obj.getMonth() === currentMonth && d.level === 3) {
        monthClean++;
      }
    });
    setMiniMonthClean(monthClean);

    return { goodCount: good, badCount: bad, streak: streakNow, bestStreak: best, ratio30: ratio };
  }, [sortedDays]);

  const objectiveProgress = useMemo(() => {
    const now = parseInputDate(todayString())!;
    let currentStreak = 0;
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const obj = parseInputDate(sortedDays[i].date)!;
      if (obj <= now && sortedDays[i].level === 3) {
        currentStreak++;
      } else if (obj <= now) {
        break;
      }
    }
    const ratio = Math.min(100, Math.round((currentStreak / objectiveDays) * 100));
    return { currentStreak, ratio };
  }, [sortedDays, objectiveDays]);

  function openModalConfirm(title: string, message: string, action: () => void) {
    setModalTitle(title);
    setModalMessage(message);
    setPendingAction(() => action);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setPendingAction(null);
  }

  function showFeedback(type: "success" | "fail" | "neutral", text: string) {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 8000);
  }

  function handleValidateDay() {
    const dateObj = parseInputDate(dayDate);
    if (!dateObj) {
      showFeedback("fail", "Choisis une date valide.");
      return;
    }
    const dateStr = localDateString(dateObj);

    const existingIndex = sortedDays.findIndex((d) => d.date === dateStr);
    if (currentEditId === null && existingIndex !== -1) {
      showFeedback(
        "fail",
        "Cette journée est déjà enregistrée. Modifie-la dans le tableau si besoin.",
      );
      return;
    }

    const autoMsg = buildAutoMessage(level);

    openModalConfirm(
      currentEditId ? "Modifier la journée" : "Valider la journée",
      currentEditId
        ? `Mettre à jour la journée du ${dateObj.toLocaleDateString(
            "fr-FR",
          )} avec le niveau ${level} ?`
        : `Enregistrer la journée du ${dateObj.toLocaleDateString(
            "fr-FR",
          )} avec le niveau ${level} ?`,
      () => {
        setDays((prev) => {
          let copy = [...prev];
          if (currentEditId) {
            const idx = copy.findIndex((d) => d.id === currentEditId);
            if (idx !== -1) {
              copy[idx] = {
                ...copy[idx],
                date: dateStr,
                level,
                note: note || undefined,
                triggers: triggers || undefined,
                difficulty,
                message: autoMsg,
              };
            }
          } else {
            const id = Date.now().toString();
            copy.push({
              id,
              date: dateStr,
              level,
              note: note || undefined,
              triggers: triggers || undefined,
              difficulty,
              message: autoMsg,
              createdAt: new Date().toISOString(),
            });
          }
          return copy;
        });

        if (level === 3) showFeedback("success", autoMsg);
        else if (level === 0) showFeedback("fail", autoMsg);
        else showFeedback("neutral", autoMsg);

        setCurrentEditId(null);
        setDayDate(todayString());
        setLevel(3);
        setNote("");
        setTriggers("");
        setDifficulty(2);
      },
    );
  }

  function startEditDay(id: string) {
    const entry = sortedDays.find((d) => d.id === id);
    if (!entry) return;
    setCurrentEditId(id);
    setDayDate(entry.date);
    setLevel(entry.level);
    setNote(entry.note || "");
    setTriggers(entry.triggers || "");
    setDifficulty(entry.difficulty || 2);
    const dObj = parseInputDate(entry.date)!;
    showFeedback(
      entry.level === 3 ? "success" : entry.level === 0 ? "fail" : "neutral",
      `Mode édition sur la journée du ${dObj.toLocaleDateString("fr-FR")}.`,
    );
  }

  function confirmDeleteDay(id: string, displayDate: string) {
    openModalConfirm(
      "Supprimer la journée",
      `Supprimer définitivement la journée du ${displayDate} ?`,
      () => {
        setDays((prev) => prev.filter((d) => d.id !== id));
        if (currentEditId === id) {
          setCurrentEditId(null);
          setDayDate(todayString());
          setLevel(3);
          setNote("");
          setTriggers("");
        }
        showFeedback("neutral", "Journée supprimée.");
      },
    );
  }

  function confirmResetAll() {
    openModalConfirm(
      "Reset complet",
      "Supprimer tout l'historique, le streak et les statistiques ? Cette action est irréversible.",
      () => {
        setDays([]);
        setFeedback(null);
        showFeedback("neutral", "Historique complètement effacé.");
      },
    );
  }

  function renderCalendarCells() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const lastDay = new Date(year, month + 1, 0).getDate();

    const dayNames = [
      { key: "L", label: "L" },
      { key: "Ma", label: "M" },
      { key: "Me", label: "M" },
      { key: "J", label: "J" },
      { key: "V", label: "V" },
      { key: "S", label: "S" },
      { key: "D", label: "D" },
    ];

    const cells: React.ReactNode[] = [];

    dayNames.forEach((d) => {
      cells.push(
        <div
          key={`lbl-${d.key}`}
          className="text-[10px] font-semibold text-slate-400 text-center sm:text-[11px]"
        >
          {d.label}
        </div>,
      );
    });

    for (let i = 0; i < startWeekday; i++) {
      cells.push(
        <div
          key={`empty-${i}`}
          className="calendar-cell bg-slate-900/60 border border-slate-700 opacity-30"
        />,
      );
    }

    const todayStr = todayString();

    for (let d = 1; d <= lastDay; d++) {
      const dateLocal = new Date(year, month, d);
      const dateStr = localDateString(dateLocal);
      const entry = sortedDays.find((x) => x.date === dateStr);

      let className = "calendar-cell border transition";

      if (!entry) {
        className += " bg-slate-900/60 text-slate-500 border-slate-700";
      } else if (entry.level === 3) {
        className += " bg-emerald-500 text-white border-emerald-500";
      } else if (entry.level === 0) {
        className += " bg-red-500 text-white border-red-500";
      } else {
        className += " bg-blue-500 text-white border-blue-500";
      }

      if (dateStr === todayStr) {
        className += " ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900";
      }

      cells.push(
        <div key={`day-${d}`} className={className}>
          {d}
        </div>,
      );
    }

    return { monthName, cells };
  }

  const { monthName, cells } = renderCalendarCells();

  function exportCSV() {
    if (sortedDays.length === 0) {
      showFeedback("neutral", "Aucune donnée à exporter.");
      return;
    }
    const header = [
      "id",
      "date",
      "level",
      "note",
      "triggers",
      "difficulty",
      "message",
      "createdAt",
    ];
    const rows = [header.join(";")];
    sortedDays.forEach((d) => {
      const row = [
        d.id,
        d.date,
        d.level,
        (d.note || "").replace(/\n/g, " "),
        d.triggers || "",
        d.difficulty || "",
        (d.message || "").replace(/\n/g, " "),
        d.createdAt || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";");
      rows.push(row);
    });

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stop_masturbation_historique.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback("success", "Export CSV généré.");
  }

  return (
    <main className="flex min-h-screen flex-col py-4 space-y-4">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-[0.16em] uppercase text-emerald-400">
            Stop Masturbation
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Un jour à la fois. Valide chaque journée, construis ta discipline et suis ton avancée.
          </p>

          <div className="mt-2 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">
              <span className="truncate pr-2">Objectif en cours</span>
              <span className="whitespace-nowrap text-emerald-400 font-semibold">
                {objectiveDays} jours
              </span>
            </div>
            <div className="flex items-center justify-between rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">
              <span className="truncate pr-2">Meilleure série</span>
              <span className="whitespace-nowrap text-emerald-400 font-semibold">
                {miniBestStreak} j
              </span>
            </div>
            <div className="flex items-center justify-between rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">
              <span className="truncate pr-2">Ce mois</span>
              <span className="whitespace-nowrap text-emerald-400 font-semibold">
                {miniMonthClean} j clean
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span>Objectif : zéro rechute durable</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <motion.div
        className="grid gap-4 md:grid-cols-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Colonne 1 : journée en cours */}
        <section className="card-surface">
          <div className="mb-3 flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em]">
              Journée en cours
            </div>
            <div className="rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-400">
              Stockage local v2
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400" htmlFor="dayDate">
                Date
              </label>
              <Input
                id="dayDate"
                type="date"
                value={dayDate}
                onChange={(e) => setDayDate(e.target.value)}
                className="h-9 rounded-xl border-slate-600 bg-slate-900/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400" htmlFor="level">
                Niveau de réussite
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value) as 0 | 1 | 2 | 3)}
                className="h-9 w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 text-xs text-slate-100 outline-none"
              >
                <option value={3}>3 - Journée clean (aucune rechute)</option>
                <option value={2}>2 - Journée neutre (envies mais maîtrisées)</option>
                <option value={1}>1 - Grosse lutte (rechute évitée de justesse)</option>
                <option value={0}>0 - Échec (rechute)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400" htmlFor="note">
                Commentaire (optionnel)
              </label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contexte de la journée, déclencheurs, heure de la tentation, etc."
                className="min-h-[70px] max-h-[140px] rounded-xl border-slate-600 bg-slate-900/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400" htmlFor="triggers">
                Déclencheurs (optionnel)
              </label>
              <Input
                id="triggers"
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
                placeholder="Ex: ennui, téléphone, réseaux, solitude..."
                className="h-9 rounded-xl border-slate-600 bg-slate-900/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400" htmlFor="difficulty">
                Difficulté ressentie (1 à 3)
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="h-9 w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 text-xs text-slate-100 outline-none"
              >
                <option value={1}>1 - Facile</option>
                <option value={2}>2 - Moyen</option>
                <option value={3}>3 - Très dur</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                onClick={handleValidateDay}
                className="rounded-full bg-emerald-400 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-950 shadow-[0_12px_24px_rgba(22,163,74,0.4)] hover:bg-emerald-300"
              >
                {currentEditId ? "Mettre à jour" : "Valider la journée"}
              </Button>
              <Button
                type="button"
                onClick={confirmResetAll}
                className="rounded-full bg-red-500 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-50 shadow-[0_12px_24px_rgba(220,38,38,0.4)] hover:bg-red-400"
              >
                Reset complet
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={exportCSV}
                className="rounded-full border-slate-500 bg-transparent px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300 hover:bg-slate-900/70"
              >
                Exporter CSV
              </Button>
            </div>

            <p className="text-[11px] text-slate-400">
              Une seule entrée par jour. Tu peux ensuite modifier ou supprimer la journée dans
              l&apos;historique si nécessaire.
            </p>

            <div className="space-y-1 pt-1">
              <label className="text-xs text-slate-400" htmlFor="objectiveDays">
                Objectif (jours clean)
              </label>
              <Input
                id="objectiveDays"
                type="number"
                min={1}
                value={objectiveDays}
                onChange={(e) => setObjectiveDays(Number(e.target.value) || 1)}
                className="h-9 w-24 rounded-xl border-slate-600 bg-slate-900/80 text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Exemple : 30 jours clean. Tu peux adapter à 7, 14, 60, 90, etc.
              </p>
            </div>

            {feedback && (
              <div
                className={`mt-2 rounded-xl border-l-4 px-3 py-2 text-xs leading-relaxed sm:px-4 ${
                  feedback.type === "success"
                    ? "border-emerald-400 bg-emerald-900/40 text-emerald-100"
                    : feedback.type === "fail"
                      ? "border-red-400 bg-red-900/40 text-red-100"
                      : "border-blue-400 bg-blue-900/40 text-blue-100"
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div className="mt-2 rounded-xl border border-dashed border-slate-600 bg-slate-900/80 p-3 text-xs text-slate-100 sm:p-4">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
                Message motivation du jour
              </div>
              <div>{motivationText}</div>
            </div>
          </div>
        </section>

        {/* Colonne 2 : historique & calendrier */}
        <section className="card-surface">
          <div className="mb-3 flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em]">
              Historique & stats
            </div>
            <div className="rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-400">
              Streak, ratios, calendrier, badges
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-center shadow-sm">
                <div className="text-[11px] text-slate-400 leading-snug">
                  Jours clean (niveau 3)
                </div>
                <div className="mt-1 text-lg font-semibold text-emerald-400">{goodCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-center shadow-sm">
                <div className="text-[11px] text-slate-400 leading-snug">
                  Jours d&apos;échec (niveau 0)
                </div>
                <div className="mt-1 text-lg font-semibold text-red-400">{badCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-center shadow-sm">
                <div className="text-[11px] text-slate-400 leading-snug">Streak actuel</div>
                <div className="mt-1 text-lg font-semibold text-sky-400">{streak}</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-center shadow-sm">
                <div className="text-[11px] text-slate-400 leading-snug">% clean (30 jours)</div>
                <div className="mt-1 text-lg font-semibold text-yellow-300">{ratio30} %</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400">Progression vers l&apos;objectif</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full border border-slate-600 bg-slate-900/80">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-yellow-300 transition-[width] duration-300"
                  style={{ width: `${objectiveProgress.ratio}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">
                {objectiveProgress.currentStreak} / {objectiveDays} jours
              </span>
            </div>

            {/* Historique */}
            <div className="rounded-2xl border border-slate-700 bg-slate-950/80">
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead className="sticky top-0 bg-slate-950">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Niveau
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Message
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDays.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                          Aucune journée enregistrée pour le moment.
                        </td>
                      </tr>
                    ) : (
                      sortedDays.map((d) => {
                        const dObj = parseInputDate(d.date)!;
                        const levelLabel: Record<number, string> = {
                          3: "Clean",
                          2: "Neutre",
                          1: "Grosse lutte",
                          0: "Échec",
                        };
                        let pillClass =
                          "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold border ";
                        if (d.level === 3) {
                          pillClass += "border-emerald-400 bg-emerald-900/40 text-emerald-100";
                        } else if (d.level === 0) {
                          pillClass += "border-red-400 bg-red-900/40 text-red-100";
                        } else {
                          pillClass += "border-sky-400 bg-sky-900/40 text-sky-100";
                        }

                        return (
                          <tr key={d.id} className="border-t border-slate-800">
                            <td className="px-3 py-2 align-top text-slate-100">
                              {dObj.toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-3 py-2 align-top">
                              <span className={pillClass}>{levelLabel[d.level]}</span>
                            </td>
                            <td className="px-3 py-2 align-top text-slate-200">
                              <div className="text-xs break-words">{d.message || ""}</div>
                              {d.note && (
                                <div className="mt-1 text-[11px] text-slate-400 break-words">
                                  ✏️ {d.note}
                                </div>
                              )}
                              {d.triggers && (
                                <div className="mt-1 text-[11px] text-yellow-300 break-words">
                                  ⚠️ Triggers : {d.triggers}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="flex flex-wrap gap-1">
                                <button
                                  className="rounded-full border border-sky-500 bg-slate-900/80 px-2 py-1 text-[10px] text-sky-400 hover:bg-slate-900"
                                  type="button"
                                  onClick={() => startEditDay(d.id)}
                                >
                                  Modifier
                                </button>
                                <button
                                  className="rounded-full border border-red-500 bg-slate-900/80 px-2 py-1 text-[10px] text-red-400 hover:bg-slate-900"
                                  type="button"
                                  onClick={() =>
                                    confirmDeleteDay(d.id, dObj.toLocaleDateString("fr-FR"))
                                  }
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calendrier */}
            <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
              <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Calendrier de {monthName}
              </div>
              <div className="mb-2 flex flex-wrap justify-center gap-2 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Clean
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Échec
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Neutre / lutte
                </span>
              </div>
              <div className="calendar-grid">{cells}</div>
            </div>
          </div>
        </section>
      </motion.div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="card-surface w-full max-w-md">
            <h2 className="mb-2 text-center text-sm font-semibold">{modalTitle}</h2>
            <p className="mb-4 text-center text-xs text-slate-300">{modalMessage}</p>
            <div className="flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeModal}
                className="rounded-full border-slate-500 bg-transparent px-4 py-1 text-[11px] text-slate-300"
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (pendingAction) pendingAction();
                  closeModal();
                }}
                className="rounded-full bg-emerald-400 px-4 py-1 text-[11px] font-semibold text-emerald-950"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
