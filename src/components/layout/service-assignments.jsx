import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar, Edit, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { getStatusColor } from "../../lib/date-utils";
import { useAssignments } from "../assignments/context/AssignmentsContext";

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

function formatDaysRemaining(days) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days < 0 ? `${Math.abs(days)} days ago` : `${days} days`;
}

const CARD_HEADER = (
  <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
    <CardTitle className="text-base font-bold flex items-center gap-1">
      <Calendar className="w-4 h-4 text-blue-600" />
      Service Assignments
    </CardTitle>
  </CardHeader>
);

export function ServiceAssignments({ selectedDate }) {
  const { getAssignmentsForDate, loading } = useAssignments();

  const currentService = selectedDate ? getAssignmentsForDate(selectedDate) : null;

  // Group assignments by role — memoized to avoid recomputing on unrelated renders
  const groupedAssignments = useMemo(() => {
    if (!currentService) return {};

    // Start with all default roles so they always appear
    const acc = Object.fromEntries(DEFAULT_ROLE_ORDER.map((r) => [r, []]));

    // Merge in any roles from the stored record (including custom ones)
    for (const { role, person } of currentService.assignments) {
      if (!acc[role]) acc[role] = [];
      if (person) acc[role].push(person);
    }

    // Return in default order first, then any custom roles appended
    const customRoles = Object.keys(acc).filter((r) => !DEFAULT_ROLE_ORDER.includes(r));
    const orderedKeys = [...DEFAULT_ROLE_ORDER, ...customRoles];
    return Object.fromEntries(orderedKeys.map((r) => [r, acc[r]]));
  }, [currentService]);

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        {CARD_HEADER}
        <CardContent className="p-3 flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading assignments...</div>
        </CardContent>
      </Card>
    );
  }

  if (!currentService) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        {CARD_HEADER}
        <CardContent className="p-3 flex items-center justify-center">
          <div className="text-sm text-gray-500 text-center">
            <div>Select a date to view service assignments</div>
            <Link to="/schedule" className="mt-2 inline-block">
              <Button size="sm" variant="outline">
                View Schedule
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColor = getStatusColor(currentService.daysRemaining);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <CardTitle className="text-base font-bold flex items-center gap-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            Service Assignments
          </CardTitle>

          <div className="flex items-center gap-1">
            <div className="text-xs font-medium text-gray-700">
              {currentService.title}
            </div>
            <Badge className={`${statusColor} px-1.5 py-0.5 text-xs ml-1`}>
              {formatDaysRemaining(currentService.daysRemaining)}
            </Badge>
            <Link to={`/schedule${selectedDate ? `?edit=${selectedDate}` : ''}`}>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-1" title="Edit Assignments">
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        <div className="space-y-2">
          {Object.entries(groupedAssignments).map(([role, people]) => (
            <div
              key={role}
              className="grid grid-cols-12 gap-1 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
            >
              <div className="col-span-4 text-gray-800 font-medium text-right pr-1 text-sm">
                {role}
              </div>
              <div className="col-span-1 text-gray-400 text-center text-sm">:</div>
              <div className="col-span-7 text-gray-900 text-sm">
                {people.length > 0 ? (
                  people.join(", ")
                ) : (
                  <span className="text-gray-400 italic">Not assigned</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <Link to={`/schedule${selectedDate ? `?edit=${selectedDate}` : ''}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              Manage All Assignments
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
