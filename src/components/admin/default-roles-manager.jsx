import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import {
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Tags,
} from "lucide-react";
import defaultRolesService from "../../services/defaultRolesService";

export const DefaultRolesManager = ({ onRolesChange }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await defaultRolesService.getDefaultRoles();
      const loaded = data || [];
      setRoles(loaded);
      onRolesChange?.(loaded.map((r) => r.name));
    } catch (err) {
      setError("Failed to load default roles");
      console.error("Error fetching default roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    const name = newRoleName.trim();
    if (!name) return;

    try {
      setAdding(true);
      setAddError(null);
      const created = await defaultRolesService.addDefaultRole(name);
      setRoles((prev) => {
        const next = [...prev, created];
        onRolesChange?.(next.map((r) => r.name));
        return next;
      });
      setNewRoleName("");
      inputRef.current?.focus();
    } catch (err) {
      setAddError(err.message || "Failed to add role");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    try {
      setDeletingId(id);
      setConfirmDeleteId(null);
      await defaultRolesService.deleteDefaultRole(id);
      setRoles((prev) => {
        const next = prev.filter((r) => r.id !== id);
        onRolesChange?.(next.map((r) => r.name));
        return next;
      });
    } catch (err) {
      setError(err.message || "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Tags className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Default Service Roles</h3>
            <p className="text-xs text-slate-500">
              Manage the default roles available for service assignments
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchRoles}
          disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="p-6 space-y-5">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Role list */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : roles.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No default roles yet. Add one below.</p>
        ) : (
          <ul className="space-y-2">
            {roles.map((role) => (
              <li
                key={role.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                  {role.name}
                </span>

                {confirmDeleteId === role.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-red-600 font-medium">Delete?</span>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={deletingId === role.id}
                      className="inline-flex items-center gap-1 h-7 px-3 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === role.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Yes"
                      )}
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="h-7 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-white"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    disabled={deletingId === role.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40"
                    aria-label={`Delete ${role.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add role form */}
        <form onSubmit={handleAddRole} className="flex gap-2 pt-1">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newRoleName}
              onChange={(e) => {
                setNewRoleName(e.target.value);
                if (addError) setAddError(null);
              }}
              placeholder="New role name…"
              maxLength={100}
              className="w-full h-10 px-4 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            />
            {addError && (
              <p className="mt-1 text-xs text-red-600">{addError}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={adding || !newRoleName.trim()}
            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm disabled:opacity-50"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </Button>
        </form>
      </div>
    </div>
  );
};
