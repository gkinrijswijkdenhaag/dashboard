// src/components/workflow/components/CategorySection.jsx
import { useWorkflow } from "../context/WorkflowContext";
import { TaskCard } from "./TaskCard";

export const CategorySection = ({ category }) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      {/* Category Header */}
      <div className={`flex items-center gap-3 p-3 ${category.color}`}>
        <category.icon className="w-5 h-5" />
        <div className="flex-1 font-medium">{category.name}</div>
      </div>

      {/* Subtasks */}
      <div className="p-2 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {category.subtasks.map((task) => (
            <TaskCard key={task.id} task={task} categoryId={category.id} />
          ))}
        </div>
      </div>
    </div>
  );
};
