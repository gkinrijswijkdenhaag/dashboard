import { useEffect, useState } from "react";
import { WorkflowProvider } from "./context/WorkflowContext";
import { workflowCategories } from "./constants/workflow-categories";
import { CategorySection } from "./components/CategorySection";
import { ModalManager } from "./components/ModalManager";
import chatService from "../../services/chatService";

export function WorkflowBoard({
  service,
  currentUserRole,
  onStartAction,
  dateString,
}) {
  // Normalize the user role for consistent handling
  const normalizedRole =
    typeof currentUserRole === "string"
      ? currentUserRole
      : currentUserRole?.id || "guest";

  // Refresh key drives a data reload in WorkflowProvider
  const [refreshKey, setRefreshKey] = useState(0);

  // Drive refreshes from socket events; 30s fallback poll when socket is offline
  useEffect(() => {
    let interval;

    const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

    // Immediate refresh via server-sent activity_update events
    chatService.onActivityUpdate(triggerRefresh);

    const startFallbackPoll = (ms) => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (!document.hidden) triggerRefresh();
      }, ms);
    };

    // 30s fallback when active, 60s when tab is hidden
    startFallbackPoll(30000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        triggerRefresh();
        startFallbackPoll(30000);
      } else {
        startFallbackPoll(60000);
      }
    };

    const handleFocus = () => {
      if (!document.hidden) triggerRefresh();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      chatService.offActivityUpdate(triggerRefresh);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <WorkflowProvider
      service={service}
      currentUserRole={normalizedRole}
      onStartAction={onStartAction}
      dateString={dateString}
      refreshKey={refreshKey}
    >
      <div className="space-y-3 md:space-y-4">
        {workflowCategories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
        <ModalManager />
      </div>
    </WorkflowProvider>
  );
}