import api from "./api";

/**
 * Service for managing workflow tasks
 */
const workflowService = {
  /**
   * Get workflow tasks for a specific service date
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @returns {Promise} Promise with workflow tasks
   */
  getWorkflowTasks: async (dateString) => {
    try {
      return await api.get(`/workflow/${dateString}`);
    } catch (error) {
      console.error("Error fetching workflow tasks:", error);
      throw error;
    }
  },

  /**
   * Get all workflow tasks for all services
   * @returns {Promise} Promise with all workflow tasks
   */
  getAllWorkflowTasks: async () => {
    try {
      return await api.get("/workflow");
    } catch (error) {
      console.error("Error fetching all workflow tasks:", error);
      throw error;
    }
  },

  /**
   * Update a task status
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @param {string} taskId - Task identifier
   * @param {string} status - New status ('pending', 'in-progress', 'completed', 'skipped')
   * @param {string} documentLink - Optional document link
   * @param {string} assignedTo - Optional role assigned to this task
   * @returns {Promise} Promise with updated task
   */
  updateTaskStatus: async (
    dateString,
    taskId,
    status,
    documentLink,
    assignedTo
  ) => {
    try {
      return await api.put(`/workflow/${dateString}/${taskId}`, {
        status,
        documentLink,
        assignedTo,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  },

  /**
   * Delete a workflow task completely
   * @param {string} dateString - Service date in YYYY-MM-DD format
   * @param {string} taskId - Task identifier
   * @returns {Promise} Promise with delete result
   */
  deleteWorkflowTask: async (dateString, taskId) => {
    try {
      return await api.delete(`/workflow/${dateString}/${taskId}`);
    } catch (error) {
      console.error("Error deleting workflow task:", error);
      throw error;
    }
  },
};

export default workflowService;
