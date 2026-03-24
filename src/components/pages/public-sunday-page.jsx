// src/components/pages/public-sunday-page.jsx
// Publicly accessible single-Sunday schedule — no login required
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, Users } from "lucide-react";
import env from "../../config/env";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Group flat assignments array into { role → [person, ...] }
function groupByRole(assignments) {
  const grouped = {};
  for (const { role, person } of assignments ?? []) {
    if (!grouped[role]) grouped[role] = [];
    if (person) grouped[role].push(person);
  }
  return grouped;
}

export function PublicSundayPage() {
  const { date } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError(null);
    fetch(`${env.API_URL}/public/schedule/${date}`)
      .then((res) => {
        if (res.status === 404) throw new Error("not_found");
        if (!res.ok) throw new Error("server_error");
        return res.json();
      })
      .then((data) => {
        setService(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [date]);

  const grouped = service ? groupByRole(service.assignments) : {};
  const roleEntries = Object.entries(grouped);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="font-bold text-gray-800 text-base sm:text-lg truncate">GKIN Service Schedule</span>
          </div>
          <span className="text-xs text-gray-400 shrink-0 hidden xs:block">Public view · read-only</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8">
        {/* ── Back to full schedule ── */}
        <Link
          to="/public/schedule"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Full schedule
        </Link>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
            <CalendarDays className="w-10 h-10 animate-pulse" />
            <span className="text-sm">Loading schedule…</span>
          </div>
        ) : error === "not_found" ? (
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No service found</h2>
            <p className="text-sm text-gray-500">
              There is no service scheduled for{" "}
              <span className="font-medium">{formatDate(date)}</span>.
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">
            <p className="text-sm">Could not load the schedule. Please try again later.</p>
          </div>
        ) : (
          <>
            {/* ── Date heading ── */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{formatDate(service.dateString)}</h1>
              {service.title && (
                <p className="mt-1 text-sm text-gray-500">{service.title}</p>
              )}
            </div>

            {/* ── Assignments card ── */}
            {roleEntries.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No assignments have been added yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                {roleEntries.map(([role, people]) => (
                  <div key={role} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-semibold text-gray-500 sm:text-gray-600 sm:w-44 sm:shrink-0 sm:pt-0.5 uppercase sm:normal-case tracking-wide sm:tracking-normal">
                      {role}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {people.length > 0 ? (
                        people.map((person, i) => (
                          <span
                            key={i}
                            className="inline-block bg-blue-50 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full"
                          >
                            {person}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm italic">Not yet assigned</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400">
        GKIN Rooster · Schedule is updated by the admin team
      </footer>
    </div>
  );
}
