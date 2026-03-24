import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Table2,
  RotateCcw,
  Share2,
  Check,
  LayoutGrid,
  Pencil,
  X,
  Save,
  Plus,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Header } from "../layout/header";
import { Footer } from "../ui/footer";
import { useAssignments } from "../assignments/context/AssignmentsContext";
import { DraggableRoleManager } from "../assignments/DraggableRoleManager";
import { DraggableRoleManagerMobile } from "../assignments/DraggableRoleManagerMobile";
import authService from "../../services/authService";
import { getAssignablePeople } from "../../services/assignablePeopleService";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Return every Sunday (YYYY-MM-DD) within [start, end] inclusive */
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

/** Format a YYYY-MM-DD string for the sticky date row label */
function formatSundayRow(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

/** YYYY-MM-DD of the nearest upcoming Sunday (or today if today is Sunday) */
function nearestSundayString() {
  const d = todayUTC();
  const diff = (7 - d.getUTCDay()) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Today's date at midnight UTC */
function todayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** YYYY-MM-DD string of today */
function todayString() {
  return todayUTC().toISOString().slice(0, 10);
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_ROLE_NAMES = new Set([
  "Voorganger", "Ouderling van dienst", "Collecte", "Preekvertaling",
  "Muzikale begeleiding", "Muzikale bijdrage", "Voorzangers", "Lector",
  "Beamer", "Streaming", "Geluid", "Kindernevendienst", "Ontvangstteam", "Koffiedienst",
]);

// ─── Component ───────────────────────────────────────────────────────────────

export function SchedulePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = authService.getCurrentUser();
  const {
    assignments, loading,
    updateAssignment, updateAssignmentsForDate, saveAssignments, resetAssignments,
    addRole, removeRole, getAssignmentsForDate,
  } = useAssignments();

  const [emailMap, setEmailMap] = useState({});
  const [copied, setCopied] = useState(false);
  const [sharedDate, setSharedDate] = useState(null);
  const [layoutView, setLayoutView] = useState("table"); // "table" | "cards"
  const [year, setYear] = useState(() => todayUTC().getUTCFullYear());

  // ── Edit panel state ────────────────────────────────────────────────────
  const [editingDate, setEditingDate] = useState(() => searchParams.get("edit") || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [assignablePeople, setAssignablePeople] = useState([]);

  // If a date was passed via ?edit=, switch to that year automatically
  useEffect(() => {
    const editDate = searchParams.get("edit");
    if (editDate) {
      const y = parseInt(editDate.slice(0, 4), 10);
      if (!isNaN(y)) setYear(y);
      setEditingDate(editDate);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShareLink = () => {
    const url = `${window.location.origin}/public/schedule`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareDate = async (dateStr) => {
    const url = `${window.location.origin}/public/schedule/${dateStr}`;
    try {
      await navigator.clipboard.writeText(url);
      setSharedDate(dateStr);
      setTimeout(() => setSharedDate(null), 2000);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }; // name (lowercase) → email

  useEffect(() => {
    getAssignablePeople(false)
      .then((people) => {
        const map = {};
        for (const p of people ?? []) {
          if (p.name && p.email) map[p.name.toLowerCase()] = p.email;
        }
        setEmailMap(map);
      })
      .catch(() => {});
  }, []);

  // Fetch active people for the editor
  useEffect(() => {
    getAssignablePeople(true).then((p) => setAssignablePeople(p ?? [])).catch(() => {});
  }, []);

  const refreshAssignablePeople = () => {
    getAssignablePeople(true)
      .then((p) => {
        const people = p ?? [];
        setAssignablePeople(people);
        const map = {};
        for (const person of people) {
          if (person.name && person.email) map[person.name.toLowerCase()] = person.email;
        }
        setEmailMap(map);
      })
      .catch(() => {});
  };

  // ── Derived data ────────────────────────────────────────────────────────

  const sundaysInWindow = useMemo(() => {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    return getSundaysInRange(start, end);
  }, [year]);

  // Build a lookup: dateString → Map<role, string (comma-joined people)>
  const assignmentMap = useMemo(() => {
    const map = {};
    if (!assignments) return map;
    for (const service of assignments) {
      const roleMap = {};
      for (const { role, person } of service.assignments ?? []) {
        if (!roleMap[role]) roleMap[role] = [];
        if (person) roleMap[role].push(person);
      }
      // Convert arrays to comma-joined strings (empty string if none assigned)
      map[service.dateString] = Object.fromEntries(
        Object.entries(roleMap).map(([role, people]) => [role, people.join(", ")])
      );
    }
    return map;
  }, [assignments]);

  // Collect all unique roles in role_order from services within the window
  const allRoles = useMemo(() => {
    const seen = new Set();
    const ordered = [];
    // Use all assignments to preserve order across dates
    if (!assignments) return ordered;
    for (const service of assignments) {
      for (const { role } of service.assignments ?? []) {
        if (!seen.has(role)) {
          seen.add(role);
          ordered.push(role);
        }
      }
    }
    return ordered;
  }, [assignments]);

  const today = todayString();
  const nearest = nearestSundayString();

  // Ref attached to the nearest/today Sunday element; scrolled into view after load
  const nearestRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    const el = nearestRef.current;
    if (!el) return;
    const id = setTimeout(() => {
      if (layoutView === "cards") {
        // Vertical card list: center the target card (avoids sticky header overlap)
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      } else {
        // Table with horizontal overflow: center the target column
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }, 150);
    return () => clearTimeout(id);
  }, [loading, layoutView, year]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleLogout = () => authService.logout();
  const handlePrevYear = () => setYear((y) => y - 1);
  const handleNextYear = () => setYear((y) => y + 1);
  const handleThisYear = () => setYear(todayUTC().getUTCFullYear());

  // ── Edit panel helpers ───────────────────────────────────────────────────

  const editingService = editingDate ? getAssignmentsForDate(editingDate) : null;

  const groupedEditAssignments = useMemo(() => {
    if (!editingService?.assignments) return {};
    const grouped = {};
    editingService.assignments.forEach((a, i) => {
      if (!grouped[a.role]) grouped[a.role] = [];
      grouped[a.role].push({ ...a, originalIndex: i });
    });
    return grouped;
  }, [editingService]);

  const getPeopleForRole = (roleName) => {
    if (!assignablePeople?.length) return [];
    return assignablePeople.filter(
      (p) => p.roles && Array.isArray(p.roles) && p.roles.includes(roleName)
    );
  };

  const handleOpenEdit = (dateStr) => {
    setEditingDate(dateStr);
    setSaveSuccess(false);
    setNewRoleName("");
  };

  const handleCloseEdit = () => {
    setEditingDate(null);
    setSaveSuccess(false);
    setNewRoleName("");
  };

  const handleSaveForDate = async () => {
    if (!editingDate || !editingService) return;
    setIsSaving(true);
    try {
      await saveAssignments(editingDate, editingService.assignments);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRole = (e) => {
    e.preventDefault();
    if (newRoleName.trim() && editingDate) {
      addRole(editingDate, newRoleName.trim());
      setNewRoleName("");
    }
  };

  const handleRemoveSlot = async (slotIndex) => {
    if (!editingService?.assignments || !editingDate) return;
    const updated = editingService.assignments.filter((_, i) => i !== slotIndex);
    updateAssignmentsForDate(editingDate, updated);
    try {
      await saveAssignments(editingDate, updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error removing slot:", err);
    }
  };

  const handleAddPersonToRole = (roleName) => {
    if (editingDate) addRole(editingDate, roleName);
  };

  const handleRoleReorder = (sourceIndex, destIndex) => {
    if (!editingService?.assignments || !editingDate) return;
    const roles = [];
    const roleMap = new Map();
    editingService.assignments.forEach((a) => {
      if (!roleMap.has(a.role)) { roleMap.set(a.role, []); roles.push(a.role); }
      roleMap.get(a.role).push(a);
    });
    const [moved] = roles.splice(sourceIndex, 1);
    roles.splice(destIndex, 0, moved);
    const reordered = roles.flatMap((r) => roleMap.get(r));
    updateAssignmentsForDate(editingDate, reordered);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title="Service Schedule"
        subtitle="View role assignments across services"
        user={user}
        onLogout={handleLogout}
        showNotifications={true}
        showUserInfo={true}
        showLogout={true}
      />

      <main className="flex-1 max-w-full px-3 sm:px-4 py-4 sm:py-6 mx-auto w-full">
        {/* ── Controls bar ── */}
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 text-gray-600"
              onClick={() => navigate("/dashboard")}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Home</span>
            </Button>
          </div>

          {/* Year navigator */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handlePrevYear}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-gray-800 min-w-[48px] text-center">{year}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleNextYear}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {year !== todayUTC().getUTCFullYear() && (
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-gray-600 h-8" onClick={handleThisYear}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">This year</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Share */}
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1.5 h-8 ${
                copied ? "text-green-600 border-green-400" : "text-gray-600"
              }`}
              onClick={handleShareLink}
              title="Copy public schedule link"
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share</span></>}
            </Button>
            {/* Layout toggle */}
            <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setLayoutView("table")}
                className={`px-2 py-1.5 flex items-center transition-colors ${
                  layoutView === "table" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
                title="Transposed table"
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutView("cards")}
                className={`px-2 py-1.5 flex items-center transition-colors ${
                  layoutView === "cards" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
                title="Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
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
        ) : sundaysInWindow.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <Table2 className="w-10 h-10" />
              <span className="text-sm">No Sundays in this period.</span>
            </div>
          </div>
        ) : layoutView === "cards" ? (
            /* ── Cards view (all screen sizes) ── */
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
                      <div className="ml-auto flex items-center gap-1.5">
                        {isToday && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 border border-blue-300 rounded-full px-2 py-0.5">
                            Today
                          </span>
                        )}
                        {isNearest && (
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 border border-indigo-300 rounded-full px-2 py-0.5">
                            Next
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenEdit(dateStr)}
                          className="p-1 rounded hover:bg-black/10 text-gray-500 hover:text-gray-800 transition-colors"
                          title="Edit assignments"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleShareDate(dateStr)}
                          className="p-1 rounded hover:bg-black/10 text-gray-500 hover:text-green-600 transition-colors"
                          title="Copy public link for this service"
                        >
                          {sharedDate === dateStr ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {rolesToShow.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400 italic">No assignments yet</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {rolesToShow.map((role) => {
                          const personStr = dayData?.[role] ?? "";
                          const people = personStr.split(",").map((p) => p.trim()).filter(Boolean);
                          return (
                            <div key={role} className="px-4 py-2 flex items-baseline gap-2">
                              <span className="text-[11px] font-semibold text-gray-400 w-28 shrink-0 leading-tight pt-0.5">
                                {role}
                              </span>
                              <div className="flex flex-col gap-0 min-w-0">
                                {people.length > 0 ? people.map((name, i) => (
                                  <div key={i} className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-[13px] font-semibold text-gray-800 leading-snug">{name}</span>
                                    {emailMap[name.toLowerCase()] && (
                                      <a
                                        href={`mailto:${emailMap[name.toLowerCase()]}`}
                                        className="text-[10px] text-blue-400 hover:text-blue-600 hover:underline truncate leading-snug"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {emailMap[name.toLowerCase()]}
                                      </a>
                                    )}
                                  </div>
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-scroll overflow-y-auto max-h-[calc(100vh-260px)] pb-4 scrollbar-always-x">
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
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          <div>{formatSundayRow(dateStr)}</div>
                          {isToday && <div className="text-[9px] font-medium text-blue-400 mt-0.5">Today</div>}
                          {isNearest && <div className="text-[9px] font-medium text-indigo-400 mt-0.5">Next</div>}
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <button
                              onClick={() => handleOpenEdit(dateStr)}
                              className="p-1 rounded hover:bg-black/10 text-inherit opacity-60 hover:opacity-100 transition-opacity"
                              title="Edit assignments"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleShareDate(dateStr)}
                              className="p-1 rounded hover:bg-black/10 text-inherit opacity-60 hover:opacity-100 transition-opacity"
                              title="Copy public link for this service"
                            >
                              {sharedDate === dateStr ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
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
                        const personStr = assignmentMap[dateStr]?.[role];
                        const people = personStr
                          ? personStr.split(",").map((p) => p.trim()).filter(Boolean)
                          : [];
                        return (
                          <td
                            key={dateStr}
                            className={`border-r border-b border-gray-100 px-2 py-1.5 text-center ${
                              isToday ? "bg-blue-50/50" : isNearest ? "bg-indigo-50/20" : ""
                            }`}
                          >
                            {people.length > 0 ? (
                              <div className="flex flex-col items-center gap-0.5">
                                {people.map((name, i) => (
                                  <div key={i} className="leading-tight">
                                    <span className="text-[12px] font-semibold text-gray-800 block">{name}</span>
                                    {emailMap[name.toLowerCase()] && (
                                      <a
                                        href={`mailto:${emailMap[name.toLowerCase()]}`}
                                        className="text-[10px] text-blue-400 hover:text-blue-600 hover:underline block"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {emailMap[name.toLowerCase()]}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300 select-none text-xs">—</span>
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
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-indigo-50/40 border border-indigo-200" />
            <span>Next Sunday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300 font-semibold text-base leading-none">—</span>
            <span>Not assigned</span>
          </div>
        </div>
      </main>

      {/* ── Edit slide-over panel ── */}
      {editingDate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={handleCloseEdit} />

          {/* Panel */}
          <div className="relative z-10 w-full sm:w-[500px] bg-white shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
              editingDate === today ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium leading-tight">
                    You are editing the service for
                  </span>
                  <h2 className="font-bold text-gray-800 text-sm leading-tight">
                    {formatSundayRow(editingDate)}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCloseEdit}
                className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Save success banner */}
            {saveSuccess && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200 text-green-700 text-sm shrink-0">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Saved successfully!</span>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">
              {editingService ? (
                <>
                  {/* Mobile layout */}
                  <div className="lg:hidden">
                    <DraggableRoleManagerMobile
                      groupedAssignments={groupedEditAssignments}
                      onReorder={handleRoleReorder}
                      updateAssignment={updateAssignment}
                      handleRemoveRole={handleRemoveSlot}
                      handleAddPersonToRole={handleAddPersonToRole}
                      getPeopleForRole={getPeopleForRole}
                      currentService={editingService}
                      defaultRoleNames={DEFAULT_ROLE_NAMES}
                      onPersonAdded={refreshAssignablePeople}
                    />
                  </div>
                  {/* Desktop layout */}
                  <div className="hidden lg:block">
                    <DraggableRoleManager
                      groupedAssignments={groupedEditAssignments}
                      onReorder={handleRoleReorder}
                      updateAssignment={updateAssignment}
                      handleRemoveRole={handleRemoveSlot}
                      handleAddPersonToRole={handleAddPersonToRole}
                      getPeopleForRole={getPeopleForRole}
                      currentService={editingService}
                      defaultRoleNames={DEFAULT_ROLE_NAMES}
                      onPersonAdded={refreshAssignablePeople}
                    />
                  </div>

                  {/* Add role */}
                  <form onSubmit={handleAddRole} className="mt-5 pt-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Input
                        placeholder="New role name…"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 shrink-0">
                        <Plus className="w-4 h-4 mr-1" /> Add Role
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
                  <CalendarDays className="w-10 h-10" />
                  <span className="text-sm">No service found for this date.</span>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 bg-gray-50">
              <Button variant="ghost" size="sm" className="text-gray-600" onClick={handleCloseEdit}>
                Close
              </Button>
              <Button
                size="sm"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white h-9 px-4"
                onClick={handleSaveForDate}
                disabled={isSaving || !editingService}
              >
                {isSaving ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
