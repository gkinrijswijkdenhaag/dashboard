// src/components/assignments/context/AssignmentsContext.jsx
import { createContext, useState, useContext, useEffect, useRef } from "react";
import { getUpcomingSundays } from "../../../lib/date-utils";
import * as assignmentsService from "../../../services/assignmentsService";
import defaultRolesService from "../../../services/defaultRolesService";

const AssignmentsContext = createContext();

export const useAssignments = () => useContext(AssignmentsContext);

// --- Pure module-level helpers (no state dependencies) ---

const isAuthenticated = () => {
  const user = localStorage.getItem("currentUser");
  if (!user) return false;
  try {
    return !!JSON.parse(user).token;
  } catch {
    return false;
  }
};

const computeDaysRemaining = (dateString) => {
  const date = new Date(dateString + "T00:00:00Z");
  const today = new Date();
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const createServiceObject = (dateString, assignments) => {
  if (!assignments) assignments = [];
  const date = new Date(dateString + "T00:00:00Z");
  const daysRemaining = computeDaysRemaining(dateString);
  return {
    date,
    dateString,
    title: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    daysRemaining,
    status: daysRemaining < 0 ? "past" : "upcoming",
    assignments,
  };
};

const mergeWithDefaultRoles = (savedAssignments, defaultRolesParam) => {
  // Build a map of role -> saved entries for quick lookup
  const savedByRole = new Map();
  for (const entry of savedAssignments) {
    if (!savedByRole.has(entry.role)) savedByRole.set(entry.role, []);
    savedByRole.get(entry.role).push(entry);
  }

  // Always start with all default roles in order
  const merged = defaultRolesParam.map(({ role }) => {
    const saved = savedByRole.get(role);
    if (saved && saved.length > 0) {
      savedByRole.delete(role); // consumed
      return saved; // may be multiple entries per role
    }
    return [{ role, person: "" }];
  }).flat();

  // Append any custom (non-default) roles that were saved
  for (const entries of savedByRole.values()) {
    merged.push(...entries);
  }

  return merged;
};

const transformBackendData = (backendData, defaultRolesParam) => {
  const groupedByDate = backendData.reduce((acc, item) => {
    if (!acc[item.dateString]) {
      acc[item.dateString] = { dateString: item.dateString, assignments: [] };
    }
    if (item.assignments && Array.isArray(item.assignments)) {
      acc[item.dateString].assignments = item.assignments;
    }
    return acc;
  }, {});

  return Object.values(groupedByDate)
    .map(({ dateString, assignments }) =>
      createServiceObject(dateString, mergeWithDefaultRoles(assignments, defaultRolesParam))
    )
    .sort((a, b) => new Date(a.dateString) - new Date(b.dateString));
};

export const AssignmentsProvider = ({ children }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Role-person entries fetched from DB; empty until the fetch resolves
  const [rolePersonEntries, setRolePersonEntries] = useState([]);
  const rolePersonEntriesRef = useRef([]);

  // Load assignments from backend on component mount
  useEffect(() => {
    // Fetch roles first, then assignments — order matters for transform
    const init = async () => {
      try {
        const data = await defaultRolesService.getDefaultRoles();
        if (data && data.length > 0) {
          const entries = data.map((r) => ({ role: r.name, person: "" }));
          rolePersonEntriesRef.current = entries;
          setRolePersonEntries(entries);
        }
      } catch (err) {
        console.warn("Could not fetch default roles, using fallback", err);
      }

      if (isAuthenticated()) {
        loadAssignments();
      } else {
        setLoading(false);
      }
    };

    init();

    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = (e) => {
      if (e.key === "currentUser") {
        if (e.newValue) {
          loadAssignments();
        } else {
          setAssignments([]);
          setLoading(false);
          setError(null);
        }
      }
    };

    // Listen for a custom event that we can trigger from the same tab
    const handleAuthChange = () => {
      if (isAuthenticated()) loadAssignments();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStateChanged", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  const loadAssignments = async () => {
    // Don't attempt to load if not authenticated
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await assignmentsService.getAssignments();

      if (data && data.length > 0) {
        // Transform backend data to frontend format
        const transformedAssignments = transformBackendData(data, rolePersonEntriesRef.current);
        setAssignments(transformedAssignments);
      } else {
        // No data in database - just set empty assignments
        setAssignments([]);
      }
    } catch (err) {
      console.error("Error loading assignments:", err);
      setError("Failed to load assignments");
      // On error, also set empty assignments
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to update a specific assignment (local state only, no backend save)
  const updateAssignment = (dateString, roleIndex, newPerson) => {
    setAssignments((prevAssignments) => {
      const existingService = prevAssignments.find((s) => s.dateString === dateString);

      if (existingService) {
        return prevAssignments.map((service) => {
          if (service.dateString !== dateString) return service;
          const updatedAssignments = [...service.assignments];
          if (updatedAssignments[roleIndex]) {
            updatedAssignments[roleIndex] = { ...updatedAssignments[roleIndex], person: newPerson };
          }
          return { ...service, assignments: updatedAssignments };
        });
      }

      // Service doesn't exist — create it with role-person entries then apply the update
      const newAssignments = [...rolePersonEntriesRef.current];
      if (newAssignments[roleIndex]) {
        newAssignments[roleIndex] = { ...newAssignments[roleIndex], person: newPerson };
      }
      const newService = createServiceObject(dateString, newAssignments);
      return [...prevAssignments, newService].sort(
        (a, b) => new Date(a.dateString) - new Date(b.dateString)
      );
    });
  };

  // Function to add a new role to a specific service (local state only)
  const addRole = (dateString, roleName) => {
    if (!roleName.trim()) return;

    const newEntry = { role: roleName.trim(), person: "" };

    setAssignments((prevAssignments) => {
      const existingService = prevAssignments.find((s) => s.dateString === dateString);

      if (existingService) {
        return prevAssignments.map((service) =>
          service.dateString === dateString
            ? { ...service, assignments: [...service.assignments, newEntry] }
            : service
        );
      }

      // Service doesn't exist — create it with role-person entries + new role
      const newService = createServiceObject(dateString, [...rolePersonEntriesRef.current, newEntry]);
      return [...prevAssignments, newService].sort(
        (a, b) => new Date(a.dateString) - new Date(b.dateString)
      );
    });
  };

  // Function to remove a role from a specific service (local state only)
  const removeRole = (dateString, roleName) => {
    setAssignments((prevAssignments) =>
      prevAssignments.map((service) =>
        service.dateString === dateString
          ? { ...service, assignments: service.assignments.filter((a) => a.role !== roleName) }
          : service
      )
    );
  };

  // Function to get assignments for a specific date
  const getAssignmentsForDate = (dateString) => {
    if (!dateString) return null;
    return assignments.find((s) => s.dateString === dateString) ?? createServiceObject(dateString, [...rolePersonEntriesRef.current]);
  };

  // Function to add more future dates
  const addMoreFutureDates = async (additionalCount = 4) => {
    try {
      // Get the latest date we currently have
      const latestDate = [...assignments].sort((a, b) => {
        return new Date(b.dateString) - new Date(a.dateString);
      })[0];

      if (!latestDate) return;

      // Get new Sundays starting from the day after our latest date
      const nextDate = new Date(latestDate.dateString);
      nextDate.setDate(nextDate.getDate() + 7); // Next Sunday

      const newSundays = [];
      for (let i = 0; i < additionalCount; i++) {
        const sunday = new Date(nextDate);
        sunday.setDate(nextDate.getDate() + i * 7);
        const dateString = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;
        newSundays.push(createServiceObject(dateString, [...rolePersonEntriesRef.current]));
      }

      // Add the new services to our assignments
      setAssignments((prev) => [...prev, ...newSundays]);

      // Save to backend
      for (const assignment of newSundays) {
        try {
          await assignmentsService.saveAssignments(
            assignment.dateString,
            assignment.assignments
          );
        } catch (err) {
          console.warn(
            `Failed to save assignment for ${assignment.dateString}:`,
            err
          );
        }
      }
    } catch (err) {
      console.error("Error adding future dates:", err);
      setError("Failed to add future dates");
    }
  };

  // Function to save assignments (backend integration)
  const saveAssignments = async (dateString, assignmentData) => {
    try {
      const result = await assignmentsService.saveAssignments(
        dateString,
        assignmentData
      );
      return { success: true, data: result };
    } catch (err) {
      console.error("Error saving assignments:", err);
      return { success: false, error: err.message };
    }
  };

  // Function to remove a specific date
  const removeDate = async (dateString) => {
    try {
      // Update local state
      setAssignments((prevAssignments) => {
        return prevAssignments.filter(
          (service) => service.dateString !== dateString
        );
      });

      // Remove from backend
      await assignmentsService.resetAssignments(dateString);
    } catch (err) {
      console.error("Error removing date:", err);
      setError("Failed to remove date");
      loadAssignments();
    }
  };

  // Function to add a specific date
  const addSpecificDate = async (dateString) => {
    try {
      const exists = assignments.some((service) => service.dateString === dateString);
      if (exists) return;

      const newService = createServiceObject(dateString, [...rolePersonEntriesRef.current]);

      setAssignments((prev) =>
        [...prev, newService].sort((a, b) => new Date(a.dateString) - new Date(b.dateString))
      );

      await assignmentsService.saveAssignments(dateString, newService.assignments);
    } catch (err) {
      console.error("Error adding specific date:", err);
      setError("Failed to add date");
    }
  };

  // Function to update entire assignments array for a date (local state only)
  const updateAssignmentsForDate = (dateString, newAssignments) => {
    setAssignments((prevAssignments) => {
      return prevAssignments.map((service) => {
        if (service.dateString === dateString) {
          return {
            ...service,
            assignments: newAssignments,
          };
        }
        return service;
      });
    });
  };

  // Function to reset assignments to default roles
  const resetAssignments = async () => {
    try {
      const sundays = getUpcomingSundays(52);
      const resetData = sundays.map((sunday) => ({
        ...sunday,
        title: "Sunday Service",
        assignments: [...rolePersonEntriesRef.current],
      }));

      setAssignments(resetData);

      // Reset in backend - this will delete all assignments and recreate with defaults
      for (const assignment of resetData) {
        try {
          await assignmentsService.resetAssignments(assignment.dateString);
          await assignmentsService.saveAssignments(
            assignment.dateString,
            assignment.assignments
          );
        } catch (err) {
          console.warn(
            `Failed to reset assignment for ${assignment.dateString}:`,
            err
          );
        }
      }
    } catch (err) {
      console.error("Error resetting assignments:", err);
      setError("Failed to reset assignments");
    }
  };

  const value = {
    assignments,
    loading,
    error,
    updateAssignment,
    addRole,
    removeRole,
    getAssignmentsForDate,
    updateAssignmentsForDate,
    addMoreFutureDates,
    saveAssignments,
    removeDate,
    addSpecificDate,
    resetAssignments,
    loadAssignments,
    isAuthenticated,
    defaultRoles: rolePersonEntries,
  };

  return (
    <AssignmentsContext.Provider value={value}>
      {children}
    </AssignmentsContext.Provider>
  );
};
