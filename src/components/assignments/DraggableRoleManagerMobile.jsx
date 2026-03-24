// src/components/assignments/DraggableRoleManagerMobile.jsx
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "../ui/button";
import { PersonCombobox } from "./PersonCombobox";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Label } from "../ui/label";

export const DraggableRoleManagerMobile = ({
  groupedAssignments,
  onReorder,
  updateAssignment,
  handleRemoveRole,
  handleAddPersonToRole,
  getPeopleForRole,
  currentService,
  defaultRoleNames = new Set(),
  onPersonAdded,
}) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    onReorder(sourceIndex, destIndex);
  };

  // Convert grouped assignments to array with unique roles
  const rolesArray = Object.entries(groupedAssignments);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="roles-list-mobile">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-4 ${
              snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-2" : ""
            }`}
          >
            {rolesArray.map(([roleName, people], roleIndex) => (
              <Draggable
                key={roleName}
                draggableId={`mobile-${roleName}`}
                index={roleIndex}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`bg-gray-50 border border-gray-200 p-4 ${
                      snapshot.isDragging
                        ? "shadow-lg rounded-lg border-2 border-blue-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <Label className="text-base font-semibold text-gray-800">
                          {roleName}
                        </Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddPersonToRole(roleName)}
                        className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {people.map((assignment) => {
                        const availablePeople = getPeopleForRole(roleName);
                        // Names already used in OTHER slots of this same role
                        const usedInThisRole = new Set(
                          people
                            .filter((p) => p.originalIndex !== assignment.originalIndex)
                            .map((p) => p.person)
                            .filter(Boolean)
                        );
                        return (
                          <div
                            key={assignment.originalIndex}
                            className="flex gap-2"
                          >
                            <PersonCombobox
                              value={assignment.person}
                              onChange={(val) =>
                                updateAssignment(
                                  currentService.dateString,
                                  assignment.originalIndex,
                                  val
                                )
                              }
                              availablePeople={availablePeople}
                              usedInThisRole={usedInThisRole}
                              roleName={roleName}
                              onPersonAdded={onPersonAdded}
                              className="flex-1"
                            />
                            {(!defaultRoleNames.has(roleName) || people.length > 1) && (
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveRole(assignment.originalIndex)
                                }
                                className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
