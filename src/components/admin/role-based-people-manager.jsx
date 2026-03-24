import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Plus,
  Trash2,
  X,
  Users,
  Mail,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import {
  getAssignablePeople,
  createAssignablePerson,
  updateAssignablePerson,
  deleteAssignablePerson,
} from "../../services/assignablePeopleService";

const DEFAULT_ROLES = [
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

export const RoleBasedPeopleManager = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({});
  const [showAddForm, setShowAddForm] = useState({});
  const [formData, setFormData] = useState({});
  const [editingPerson, setEditingPerson] = useState(null);
  const [savingRole, setSavingRole] = useState(null);
  const [deletingPerson, setDeletingPerson] = useState(null);

  useEffect(() => {
    fetchPeople();
    // Expand all roles by default
    const expanded = {};
    DEFAULT_ROLES.forEach((role) => {
      expanded[role] = true;
    });
    setExpandedRoles(expanded);
  }, []);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const data = await getAssignablePeople(false);
      //   console.log("Fetched people:", data);
      setPeople(data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load assignable people");
      setPeople([]);
      console.error("Error fetching people:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role) => {
    setExpandedRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const toggleAddForm = (role) => {
    setShowAddForm((prev) => ({ ...prev, [role]: !prev[role] }));
    setFormData((prev) => ({ ...prev, [role]: { name: "", email: "" } }));
  };

  const handleAddPerson = async (role) => {
    const data = formData[role];
    if (!data?.name?.trim() || !data?.email?.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSavingRole(role);
      await createAssignablePerson({
        name: data.name,
        email: data.email,
        roles: [role],
      });
      setFormData((prev) => ({ ...prev, [role]: { name: "", email: "" } }));
      setShowAddForm((prev) => ({ ...prev, [role]: false }));
      await fetchPeople();
    } catch (err) {
      alert(err.message || "Failed to add person");
    } finally {
      setSavingRole(null);
    }
  };

  const handleUpdatePerson = async (personId, currentRoles, role, action) => {
    try {
      let newRoles;
      if (action === "add") {
        newRoles = [...new Set([...currentRoles, role])];
      } else {
        newRoles = currentRoles.filter((r) => r !== role);
      }

      await updateAssignablePerson(personId, { roles: newRoles });
      await fetchPeople();
    } catch (err) {
      alert(err.message || "Failed to update person");
    }
  };

  const handleDeletePerson = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${name} completely? This cannot be undone.`
      )
    ) {
      try {
        setDeletingPerson(id);
        await deleteAssignablePerson(id);
        await fetchPeople();
      } catch (err) {
        alert(err.message || "Failed to delete person");
      } finally {
        setDeletingPerson(null);
      }
    }
  };

  const getPersonInitials = (name) =>
    name
      ? name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
      : "?";

  const getPeopleForRole = (role) => {
    return people.filter(
      (person) =>
        person.roles &&
        Array.isArray(person.roles) &&
        person.roles.includes(role)
    );
  };

  const totalPeople = [...new Set(people.map((p) => p.id))].length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        <span className="text-sm font-medium text-slate-500">Loading people…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Failed to load</p>
          <p className="text-xs text-slate-500 mt-0.5">{error}</p>
        </div>
        <button
          onClick={fetchPeople}
          className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Service People</h3>
            <p className="text-xs text-slate-400">{totalPeople} {totalPeople === 1 ? "person" : "people"} across {DEFAULT_ROLES.length} roles</p>
          </div>
        </div>
        <button
          onClick={fetchPeople}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Role sections */}
      <div className="divide-y divide-slate-100">
        {DEFAULT_ROLES.map((role) => {
          const rolePeople = getPeopleForRole(role);
          const isExpanded = expandedRoles[role];
          const isAddFormOpen = showAddForm[role];

          return (
            <div key={role}>
              {/* Role row header */}
              <div className="flex items-center justify-between px-6 py-3">
                <button
                  onClick={() => toggleRole(role)}
                  className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-slate-800 truncate">{role}</span>
                  <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
                    {rolePeople.length}
                  </span>
                </button>
                <button
                  onClick={() => toggleAddForm(role)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0 ml-2"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-6 pb-4 space-y-3">
                  {/* Add Person Form */}
                  {isAddFormOpen && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <UserPlus className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Add new person to {role}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">Full Name <span className="text-red-500">*</span></label>
                          <input
                            id={`add-name-${role}`}
                            type="text"
                            value={formData[role]?.name || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [role]: { ...prev[role], name: e.target.value },
                              }))
                            }
                            placeholder="e.g. Jan de Vries"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">Email Address <span className="text-red-500">*</span></label>
                          <input
                            id={`add-email-${role}`}
                            type="email"
                            value={formData[role]?.email || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [role]: { ...prev[role], email: e.target.value },
                              }))
                            }
                            placeholder="name@example.com"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleAddPerson(role)}
                          disabled={savingRole === role}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-60"
                        >
                          {savingRole === role ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Adding…</>
                          ) : (
                            <><Plus className="w-3 h-3" /> Add Person</>
                          )}
                        </button>
                        <button
                          onClick={() => toggleAddForm(role)}
                          disabled={savingRole === role}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* People List */}
                  {rolePeople.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      No people assigned to this role yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                      {rolePeople.map((person) => (
                        <div
                          key={person.id}
                          className="bg-white px-4 py-3 flex items-center gap-3"
                        >
                          {/* Initials avatar */}
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600 select-none">
                            {getPersonInitials(person.name)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{person.name}</p>
                            <p className="flex items-center gap-1 text-xs text-slate-400 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              {person.email}
                            </p>
                            {person.roles && person.roles.length > 1 && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Also in: {person.roles.filter((r) => r !== role).join(", ")}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() =>
                                handleUpdatePerson(person.id, person.roles || [], role, "remove")
                              }
                              title="Remove from this role"
                              disabled={deletingPerson === person.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePerson(person.id, person.name)}
                              title="Delete person completely"
                              disabled={deletingPerson === person.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              {deletingPerson === person.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel footer */}
      <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">{DEFAULT_ROLES.length} service roles configured</p>
        <p className="text-xs text-slate-400">X = remove from role · <Trash2 className="w-3 h-3 inline" /> = delete person</p>
      </div>
    </div>
  );
};
