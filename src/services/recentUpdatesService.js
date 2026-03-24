import api from "./api";
import activityService from "./activityService";

/**
 * Service for fetching recent updates from various sources
 */
const recentUpdatesService = {
  /**
   * Get all recent updates from the activity log
   * @param {number} limit - Maximum number of updates to return
   * @param {string} since - Optional ISO timestamp to get only updates since a specific time
   * @returns {Promise} Promise with all recent updates
   */
  getAllRecentUpdates: async (limit = 5, since = null) => {
    try {
      // Fetch updates from the activity log
      const activities = await activityService.getRecentActivity(
        limit,
        null,
        since
      );

      // Transform activities into update objects
      return activities.map((activity) => ({
        id: activity.id,
        type: activity.activity_type,
        title: activity.title,
        description: activity.description,
        details: activity.details,
        timestamp: activity.created_at,
        user: activity.user_name,
        role: activity.user_role,
        icon: activity.icon,
        color: activity.color,
        dateString: activity.date_string,
        entityId: activity.entity_id,
      }));
    } catch (error) {
      console.error("Error fetching all recent updates:", error);
      throw error;
    }
  },

  /**
   * Get recent updates filtered by type
   * @param {string} type - Type of updates to fetch (workflow, assignment, etc.)
   * @param {number} limit - Maximum number of updates to return
   * @returns {Promise} Promise with filtered recent updates
   */
  getFilteredUpdates: async (type, limit = 5) => {
    try {
      // Fetch updates from the activity log with type filter
      const activities = await activityService.getRecentActivity(limit, type);

      // Transform activities into update objects
      return activities.map((activity) => ({
        id: activity.id,
        type: activity.activity_type,
        title: activity.title,
        description: activity.description,
        details: activity.details,
        timestamp: activity.created_at,
        user: activity.user_name,
        role: activity.user_role,
        icon: activity.icon,
        color: activity.color,
        dateString: activity.date_string,
        entityId: activity.entity_id,
      }));
    } catch (error) {
      console.error(`Error fetching ${type} updates:`, error);
      throw error;
    }
  },
};

export default recentUpdatesService;
