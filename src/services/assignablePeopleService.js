import api from "./api";

/**
 * Get all assignable people
 * @param {boolean} activeOnly - Whether to fetch only active people
 * @returns {Promise<Array>} List of assignable people
 */
export const getAssignablePeople = async (activeOnly = true) => {
  try {
    const endpoint = `/assignable-people?activeOnly=${activeOnly}`;
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.error("Error fetching assignable people:", error);
    throw error;
  }
};

/**
 * Get a single assignable person by ID
 * @param {number} id - Person ID
 * @returns {Promise<Object>} Assignable person
 */
export const getAssignablePersonById = async (id) => {
  try {
    const response = await api.get(`/assignable-people/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching assignable person:", error);
    throw error;
  }
};

/**
 * Create a new assignable person
 * @param {Object} personData - Person data
 * @param {string} personData.name - Person name
 * @param {string} personData.email - Person email
 * @returns {Promise<Object>} Created person
 */
export const createAssignablePerson = async (personData) => {
  try {
    const response = await api.post("/assignable-people", personData);
    return response.data;
  } catch (error) {
    console.error("Error creating assignable person:", error);
    throw error;
  }
};

/**
 * Update an assignable person
 * @param {number} id - Person ID
 * @param {Object} personData - Updated person data
 * @returns {Promise<Object>} Updated person
 */
export const updateAssignablePerson = async (id, personData) => {
  try {
    const response = await api.put(`/assignable-people/${id}`, personData);
    return response.data;
  } catch (error) {
    console.error("Error updating assignable person:", error);
    throw error;
  }
};

/**
 * Delete an assignable person
 * @param {number} id - Person ID
 * @returns {Promise<Object>} Success message
 */
export const deleteAssignablePerson = async (id) => {
  try {
    const response = await api.delete(`/assignable-people/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting assignable person:", error);
    throw error;
  }
};

/**
 * Toggle active status of an assignable person
 * @param {number} id - Person ID
 * @returns {Promise<Object>} Updated person
 */
export const toggleAssignablePersonStatus = async (id) => {
  try {
    const response = await api.patch(`/assignable-people/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error("Error toggling person status:", error);
    throw error;
  }
};
