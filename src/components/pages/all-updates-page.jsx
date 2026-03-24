import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import recentUpdatesService from "../../services/recentUpdatesService";
import {
  SingleUpdate,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../updates/update-components";

/**
 * AllUpdatesPage component for displaying all recent updates
 */
export function AllUpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, completed, in-progress
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of updates to show per page

  const fetchUpdates = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch a larger number of updates for the all updates page
      // Increased to 100 to support pagination
      const allUpdates = await recentUpdatesService.getAllRecentUpdates(100);
      setUpdates(allUpdates);
      // Reset to first page when fetching new data
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch all updates:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // Filter updates based on the selected filter
  const filteredUpdates = updates.filter((update) => {
    if (filter === "all") return true;

    // Filter by update type
    if (filter === "assignment" && update.type === "assignment") return true;

    // For workflow updates, filter by status in title
    if (update.type === "workflow") {
      const status = update.title.toLowerCase();
      if (filter === "completed" && status.includes("completed")) return true;
      if (filter === "in-progress" && status.includes("in progress"))
        return true;
    }

    return false;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUpdates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUpdates.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page navigation
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">All Updates</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="assignment">Assignments</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">All Updates</h1>
          <p className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredUpdates.length)} of{" "}
            {filteredUpdates.length} updates
          </p>
        </div>

        <div className="p-4">
          {loading && <LoadingState />}

          {error && <ErrorState onRetry={fetchUpdates} />}

          {!loading && !error && filteredUpdates.length === 0 && (
            <EmptyState message="No updates match your filter" />
          )}

          {!loading && !error && filteredUpdates.length > 0 && (
            <div className="space-y-3">
              {currentItems.map((update) => (
                <SingleUpdate key={update.id} update={update} />
              ))}
            </div>
          )}

          {/* Pagination controls */}
          {!loading && !error && filteredUpdates.length > itemsPerPage && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 mt-4">
              <div className="flex items-center text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-1 rounded ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page number buttons */}
                <div className="hidden sm:flex space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      // If near start, show first 5
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // If near end, show last 5
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Otherwise show current and 2 on each side
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-2 py-1 text-sm rounded ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-1 rounded ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
