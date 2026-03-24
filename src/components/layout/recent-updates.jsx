import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import recentUpdatesService from "../../services/recentUpdatesService";
import chatService from "../../services/chatService";
import {
  SingleUpdate,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../updates/update-components";

/**
 * RecentUpdates component
 * @param {Object} props - Component props
 * @param {number} props.limit - Maximum number of updates to display
 */
export function RecentUpdates({ limit = 5 }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchTimeRef = useRef(null); // ref avoids stale closure in useCallback
  const pollingTimerRef = useRef(null);

  // Keep track of the component's mounted state
  const isMountedRef = useRef(true);

  // Memoize the fetchUpdates function to avoid recreating it on every render
  const fetchUpdates = useCallback(
    async (isInitialFetch = false) => {
      if (!isMountedRef.current) return;

      // Only show loading indicator on initial fetch
      if (isInitialFetch) {
        setLoading(true);
      }

      setError(null);

      try {
        // For subsequent fetches, only get updates since the last fetch
        const sinceTimestamp =
          !isInitialFetch && lastFetchTimeRef.current
            ? lastFetchTimeRef.current.toISOString()
            : null;
        const recentUpdates = await recentUpdatesService.getAllRecentUpdates(
          limit,
          sinceTimestamp
        );

        if (!isMountedRef.current) return;

        if (isInitialFetch || !sinceTimestamp) {
          // For initial fetch, replace all updates
          setUpdates(recentUpdates);
        } else if (recentUpdates.length > 0) {
          // Merge using functional form to avoid stale updates closure
          setUpdates((prev) => {
            const combined = [...recentUpdates, ...prev]
              .filter(
                (update, index, self) =>
                  index === self.findIndex((u) => u.id === update.id)
              )
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, limit);
            return combined;
          });
        }

        lastFetchTimeRef.current = new Date();
      } catch (error) {
        console.error("Failed to fetch recent updates:", error);
        if (isMountedRef.current) {
          setError(error);
        }
      } finally {
        if (isMountedRef.current && isInitialFetch) {
          setLoading(false);
        }
      }
    },
    [limit]
  );

  // Set up socket-driven refresh with 60s fallback polling
  useEffect(() => {
    // Initial fetch
    fetchUpdates(true);

    // Refresh when the server emits an activity_update (near real-time)
    const handleActivityUpdate = () => fetchUpdates(false);
    chatService.onActivityUpdate(handleActivityUpdate);

    // Keep a slow fallback poll in case socket is not connected
    pollingTimerRef.current = setInterval(() => {
      fetchUpdates(false);
    }, 60000);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      chatService.offActivityUpdate(handleActivityUpdate);
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [fetchUpdates]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={() => fetchUpdates(true)} />;
  if (updates.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      {updates.map((update) => (
        <SingleUpdate key={update.id} update={update} />
      ))}

      {updates.length > 0 && (
        <Link
          to="/all-updates"
          className="block w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1 hover:underline"
        >
          View all updates
        </Link>
      )}
    </div>
  );
}
