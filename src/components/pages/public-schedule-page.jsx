// src/components/pages/public-schedule-page.jsx
// Publicly accessible — no login required
import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RotateCcw,
  Table2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "../ui/button";
import env from "../../config/env";

// ─── Helpers (mirrored from schedule-page) ──────────────────────────────────

const DEFAULT_ROLE_ORDER = [
  "Voorganger",
  "Ouderling van dienst",
  "Collecte",
  "Preekvertaling",
  "Muzikale begeleiding",
  "Muzikale bijdrage",
  "Voorzangers",
  "Lector",
  "Beamer",
  "Streaming",
  "Geluid",
  "Kindernevendienst",
  "Ontvangstteam",
  "Koffiedienst",
];

function todayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function todayString() {
  return todayUTC().toISOString().slice(0, 10);
}

function nearestSundayString() {
  const d = todayUTC();
  const diff = (7 - d.getUTCDay()) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getSundaysInRange(start, end) {
  const sundays = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor.getUTCDay() !== 0) cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= end) {
    sundays.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return sundays;
}

function formatSundayRow(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}



// ─── Component ───────────────────────────────────────────────────────────────

export function PublicSchedulePage() {
  const [layoutView, setLayoutView] = useState("cards"); // "table" | "cards"
  const [year, setYear] = useState(() => todayUTC().getUTCFullYear());
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch public schedule data (no auth header needed)
  useEffect(() => {
    setLoading(true);
    fetch(`${env.API_URL}/public/schedule`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load schedule");
        return res.json();
      })
      .then((data) => {
        setRawData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load the schedule. Please try again later.");
        setLoading(false);
      });
  }, []);

  const sundaysInWindow = useMemo(() => {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    return getSundaysInRange(start, end);
  }, [year]);

  // Build lookup: dateString → { role → person }
  const assignmentMap = useMemo(() => {
    const map = {};
    for (const service of rawData) {
      const roleMap = {};
      for (const { role, person } of service.assignments ?? []) {
        if (!roleMap[role]) roleMap[role] = [];
        if (person) roleMap[role].push(person);
      }
      map[service.dateString] = Object.fromEntries(
        Object.entries(roleMap).map(([r, p]) => [r, p.join(", ")])
      );
    }
    return map;
  }, [rawData]);

  // Collect all roles — default order first, then any extras observed in data
  const allRoles = useMemo(() => {
    const extra = new Set();
    for (const service of rawData) {
      for (const { role } of service.assignments ?? []) {
        if (!DEFAULT_ROLE_ORDER.includes(role)) extra.add(role);
      }
    }
    return [...DEFAULT_ROLE_ORDER, ...extra];
  }, [rawData]);

  const today = todayString();
  const nearest = nearestSundayString();

  // Ref attached to the nearest/today Sunday element; scrolled into view after load
  const nearestRef = useRef(null);
  const tableContainerRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    const id = setTimeout(() => {
      if (layoutView === "cards") {
        nearestRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      } else {
        const container = tableContainerRef.current;
        const el = nearestRef.current;
        if (!container || !el) return;
        const stickyWidth = 140; // matches min-w-[140px] of sticky role column
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const offset = elRect.left - containerRect.left - stickyWidth;
        container.scrollBy({ left: offset, behavior: "smooth" });
      }
    }, 150);
    return () => clearTimeout(id);
  }, [loading, layoutView, year]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Public header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800 text-lg">GKIN Service Schedule</span>
          </div>
          <span className="text-xs text-gray-400">Public view · read-only</span>
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* ── Controls ── */}
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
          {/* Year navigator */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setYear((y) => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-gray-800 min-w-[48px] text-center">{year}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setYear((y) => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {year !== todayUTC().getUTCFullYear() && (
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-gray-600 h-8" onClick={() => setYear(todayUTC().getUTCFullYear())}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">This year</span>
              </Button>
            )}
          </div>

          {/* Layout toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setLayoutView("cards")}
              className={`px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                layoutView === "cards" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
              title="Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setLayoutView("table")}
              className={`px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                layoutView === "table" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
              title="Table"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* ── Upcoming service banner ── */}
        {nearest && (
          <div className="mb-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
            <CalendarDays className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-400">Upcoming Service</span>
              <p className="text-sm font-bold text-indigo-800 leading-tight">
                {new Date(nearest + "T00:00:00Z").toLocaleDateString("en-GB", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
                })}
              </p>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <CalendarDays className="w-10 h-10 animate-pulse" />
              <span className="text-sm">Loading schedule…</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-400">
            <span className="text-sm">{error}</span>
          </div>
        ) : sundaysInWindow.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <Table2 className="w-10 h-10" />
              <span className="text-sm">No Sundays in this period.</span>
            </div>
          </div>
        ) : layoutView === "cards" ? (
          /* ── Cards view ── */
          <div className="space-y-3">
            {sundaysInWindow.map((dateStr) => {
              const isToday = dateStr === today;
              const isNearest = !isToday && dateStr === nearest;
              const dayData = assignmentMap[dateStr];
              const rolesToShow = allRoles;
              return (
                <div
                  key={dateStr}
                  ref={isToday || isNearest ? nearestRef : null}
                  className={`rounded-xl border shadow-sm [overflow:clip] ${
                    isToday
                      ? "border-blue-300 bg-blue-50"
                      : isNearest
                      ? "border-indigo-200 bg-indigo-50/40"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className={`sticky top-0 z-10 px-4 py-2.5 flex items-center gap-2 border-b ${
                      isToday
                        ? "bg-blue-100 border-blue-200"
                        : isNearest
                        ? "bg-indigo-100/50 border-indigo-200"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <CalendarDays className={`w-4 h-4 shrink-0 ${isToday ? "text-blue-600" : isNearest ? "text-indigo-500" : "text-gray-400"}`} />
                    <span className={`font-bold text-[15px] tracking-tight ${isToday ? "text-blue-800" : isNearest ? "text-indigo-700" : "text-gray-800"}`}>
                      {formatSundayRow(dateStr)}
                    </span>
                    {isToday && (
                      <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-100 border border-blue-300 rounded-full px-2 py-0.5">
                        Today
                      </span>
                    )}
                    {isNearest && (
                      <span className="ml-auto text-[10px] font-semibold text-indigo-600 bg-indigo-100 border border-indigo-300 rounded-full px-2 py-0.5">
                        Next
                      </span>
                    )}
                  </div>
                  {rolesToShow.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400 italic">No assignments yet</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {rolesToShow.map((role) => {
                        const people = (dayData?.[role] ?? "")
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        return (
                          <div key={role} className="px-4 py-2 flex items-baseline gap-2">
                            <span className="text-[11px] font-semibold text-gray-400 w-28 shrink-0 leading-tight pt-0.5">
                              {role}
                            </span>
                            <div className="flex flex-col gap-0 min-w-0">
                              {people.length > 0 ? people.map((name, i) => (
                                <span key={i} className="text-[13px] font-semibold text-gray-800 leading-snug">{name}</span>
                              )) : (
                                <span className="text-[12px] text-gray-300 italic leading-snug">Not assigned</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Transposed table: roles as rows, Sundays as columns ── */
          <div ref={tableContainerRef} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-scroll overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-always-x">
            <table className="border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 min-w-[140px]">
                    Role
                  </th>
                  {sundaysInWindow.map((dateStr) => {
                    const isToday = dateStr === today;
                    const isNearest = !isToday && dateStr === nearest;
                    return (
                      <th
                        key={dateStr}
                        ref={isToday || isNearest ? nearestRef : null}
                        className={`border-b border-r border-gray-200 px-2 py-1.5 text-center text-[11px] font-semibold min-w-[110px] whitespace-nowrap ${
                          isToday
                            ? "bg-blue-100 text-blue-700"
                            : isNearest
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        <div>{formatSundayRow(dateStr)}</div>
                        {isToday && <div className="text-[9px] font-medium text-blue-400 mt-0.5">Today</div>}
                        {isNearest && <div className="text-[9px] font-medium text-indigo-400 mt-0.5">Next</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allRoles.map((role, rowIdx) => (
                  <tr key={role} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <td
                      className={`sticky left-0 z-10 border-r border-b border-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600 ${
                        rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {role}
                    </td>
                    {sundaysInWindow.map((dateStr) => {
                      const isToday = dateStr === today;
                      const isNearest = !isToday && dateStr === nearest;
                      const people = (assignmentMap[dateStr]?.[role] ?? "")
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean);
                      return (
                        <td
                          key={dateStr}
                          className={`border-r border-b border-gray-100 px-2 py-1.5 text-center text-[12px] ${
                            isToday ? "bg-blue-50/50" : isNearest ? "bg-indigo-50/20" : ""
                          }`}
                        >
                          {people.length > 0 ? (
                            <span className="text-gray-800 font-semibold">
                              {people.join(", ")}
                            </span>
                          ) : (
                            <span className="text-gray-300 select-none">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-indigo-50/40 border border-indigo-200" />
            <span>Next Sunday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300 font-semibold text-base leading-none">—</span>
            <span>Not yet assigned</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400">
        GKIN Rooster · Schedule is updated by the admin team
      </footer>
    </div>
  );
}
