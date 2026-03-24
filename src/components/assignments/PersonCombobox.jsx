// src/components/assignments/PersonCombobox.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X, User, Mail } from "lucide-react";
import { createAssignablePerson } from "../../services/assignablePeopleService";

/**
 * Combobox for assigning a person to a role slot.
 * - Pick from dropdown (admin list) → single name field, email already known
 * - Type a custom name not in the list → name + email fields shown together
 * - On blur/save, custom person is added to assignable_people for future use
 */
export function PersonCombobox({
  value,
  onChange,
  availablePeople = [],
  usedInThisRole = new Set(),
  roleName = "",
  onPersonAdded,
  className = "",
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [emailValue, setEmailValue] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [saving, setSaving] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [open, updateDropdownPosition]);

  // Sync when the external value changes programmatically
  useEffect(() => {
    setInputValue(value || "");
    setEmailValue("");
  }, [value]);

  const isCustom = (name) =>
    name.trim().length > 0 &&
    !availablePeople.some((p) => p.name?.toLowerCase() === name.trim().toLowerCase());

  const showEmailField = isCustom(inputValue);

  const filtered = availablePeople.filter((p) =>
    p.name?.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (person) => {
    setInputValue(person.name);
    setEmailValue("");
    setOpen(false);
    onChange(person.name);
  };

  const handleClear = () => {
    setInputValue("");
    setEmailValue("");
    setOpen(false);
    onChange("");
  };

  const handleBlur = (e) => {
    if (containerRef.current?.contains(e.relatedTarget)) return;
    setOpen(false);
    const trimmed = inputValue.trim();
    onChange(trimmed);
    // Auto-save custom person when blurring if email is provided
    if (trimmed && isCustom(trimmed) && emailValue.trim()) {
      saveCustomPerson(trimmed, emailValue.trim());
    }
  };

  const saveCustomPerson = async (name, email) => {
    setSaving(true);
    try {
      await createAssignablePerson({
        name,
        email: email || undefined,
        roles: roleName ? [roleName] : [],
        is_active: true,
      });
      onPersonAdded?.();
    } catch {
      // silently ignore — the assignment name is already saved
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    const name = inputValue.trim();
    const email = emailValue.trim();
    if (!name) return;
    onChange(name);
    if (email) saveCustomPerson(name, email);
  };

  return (
    <div ref={containerRef} className={`flex flex-col gap-1 ${className}`} onBlur={handleBlur}>
      {/* Name input */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-2.5 flex items-center">
          <User className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <input
          type="text"
          ref={inputRef}
          value={inputValue}
          placeholder="Type name or choose…"
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full h-9 pl-8 pr-14 text-sm border-2 border-gray-300 rounded-md bg-white focus:outline-none focus:border-blue-400 transition-colors"
        />
        <div className="absolute right-0 flex items-center h-full pr-1 gap-0.5">
          {inputValue && (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            title="Show suggestions"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Email input — only shown for custom (non-list) names */}
      {showEmailField && (
        <div className="relative flex items-center gap-1.5">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-2.5 flex items-center h-full">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <input
              type="email"
              value={emailValue}
              placeholder="Email (optional)"
              onChange={(e) => setEmailValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveClick(); } }}
              className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors text-gray-700 placeholder-gray-400"
            />
          </div>
          {emailValue && (
            <button
              type="button"
              tabIndex={0}
              onClick={handleSaveClick}
              disabled={saving}
              className="h-8 px-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 shrink-0 transition-colors"
            >
              {saving ? "…" : "Add"}
            </button>
          )}
        </div>
      )}

      {/* Dropdown — portal so it never clips inside overflow containers */}
      {open && createPortal(
        <div style={dropdownStyle} className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-gray-400 italic">
              {inputValue
                ? `No matches — using "${inputValue}" as custom name`
                : "No people configured for this role"}
            </div>
          ) : (
            filtered.map((person) => {
              const isUsed = usedInThisRole.has(person.name);
              return (
                <button
                  key={person.id}
                  type="button"
                  tabIndex={0}
                  disabled={isUsed}
                  onMouseDown={(e) => { e.preventDefault(); if (!isUsed) handleSelect(person); }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed flex flex-col border-b border-gray-50 last:border-0 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800 leading-tight">
                    {person.name}
                    {isUsed && <span className="ml-1 text-xs font-normal text-gray-400">— already added</span>}
                  </span>
                  {person.email && (
                    <span className="text-xs text-gray-400 leading-tight">{person.email}</span>
                  )}
                </button>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
