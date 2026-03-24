import api from './api';

const BASE_URL = '/assignments';

// Get all assignments
export const getAssignments = async () => {
  try {
    const response = await api.get(BASE_URL);
    return response;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

// Save complete assignments for a date
export const saveAssignments = async (dateString, assignments) => {
  try {
    const response = await api.post(BASE_URL, {
      dateString,
      assignments
    });
    return response;
  } catch (error) {
    console.error('Error saving assignments:', error);
    throw error;
  }
};

// Update a specific assignment
export const updateAssignment = async (dateString, assignments) => {
  try {
    const response = await api.put(`${BASE_URL}/${encodeURIComponent(dateString)}`, {
      assignments
    });
    return response;
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
};

// Add a role to a specific assignment
export const addRole = async (dateString, roleName) => {
  try {
    const response = await api.post(`${BASE_URL}/${encodeURIComponent(dateString)}/roles`, {
      roleName
    });
    return response;
  } catch (error) {
    console.error('Error adding role:', error);
    throw error;
  }
};

// Remove a role from a specific assignment
export const removeRole = async (dateString, roleName) => {
  try {
    const response = await api.delete(`${BASE_URL}/${encodeURIComponent(dateString)}/roles/${encodeURIComponent(roleName)}`);
    return response;
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
};

// Reset assignments for a specific date
export const resetAssignments = async (dateString) => {
  try {
    const response = await api.delete(`${BASE_URL}/${encodeURIComponent(dateString)}/reset`);
    return response;
  } catch (error) {
    console.error('Error resetting assignments:', error);
    throw error;
  }
};